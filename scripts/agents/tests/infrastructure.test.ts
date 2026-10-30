/** Boundary and lifecycle regression tests use isolated project-local fixtures only. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { guard } from '../guard.ts';
import { handleHook } from '../hook-handler.ts';
import { projectRoot, record, safePath } from '../workspace.ts';
import { validate } from '../validate.ts';

function createFixture(): string {
  mkdirSync(join(projectRoot, 'scripts/agents/.fixtures'), { recursive: true });
  const fixture = mkdtempSync(join(projectRoot, 'scripts/agents/.fixtures/test-'));
  mkdirSync(join(fixture, 'packages'));
  writeFileSync(join(fixture, 'package.json'), '{"scripts":{"test":"vitest run"}}');
  return fixture;
}

void test('rejects traversal, protected files, and symlinks leaving the approved root', () => {
  const fixture = createFixture();
  try {
    for (const path of [
      '../escape',
      '.git/config',
      'dev.route.json',
      '.env',
      'nested/.aws/token',
      'secret.key',
    ]) {
      assert.throws(() => safePath(fixture, path));
    }
    symlinkSync(projectRoot, join(fixture, 'escape'), 'junction');
    assert.throws(() => safePath(fixture, 'escape/package.json'));
    assert.equal(safePath(fixture, 'new/file.ts'), join(fixture, 'new/file.ts'));
    mkdirSync(join(fixture, '.git'));
    symlinkSync(join(fixture, '.git'), join(fixture, 'private-alias'), 'junction');
    assert.throws(() => safePath(fixture, 'private-alias/config'));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('blocks Git mutations, shell chains, protected paths and native edit escapes', () => {
  const fixture = createFixture();
  try {
    for (const command of [
      'git push',
      'git -C . commit',
      'git status; git add .',
      'git diff --output=x',
      'gh pr create',
      'sudo x',
      'curl example.com',
      'cat dev.route.json',
      'cd ..',
    ]) {
      assert.throws(() => guard(fixture, { cwd: fixture, tool_input: { command } }));
    }
    guard(fixture, { cwd: fixture, tool_input: { command: 'git status --short' } });
    guard(fixture, { cwd: fixture, tool_input: { command: 'pnpm test:all' } });
    guard(fixture, { cwd: fixture, tool_input: { command: 'pnpm git:safety' } });
    assert.throws(() => guard(fixture, { cwd: fixture, tool_input: { file_path: '../outside' } }));
    assert.throws(() =>
      guard(fixture, { cwd: fixture, tool_input: '*** Update File: ../outside\n' }),
    );
    assert.throws(() =>
      guard(fixture, { cwd: fixture, tool_input: { patch: '*** Move to: .git/config\n' } }),
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('resolves tool paths against the tool cwd and rejects malformed inputs', () => {
  const fixture = createFixture();
  try {
    mkdirSync(join(fixture, 'nested'));
    guard(fixture, { cwd: join(fixture, 'nested'), tool_input: { path: '../safe.ts' } });
    assert.throws(() => guard(fixture, { tool_input: {} }));
    assert.throws(() => record([]));
    assert.throws(() => handleHook(fixture, { cwd: fixture, hook_event_name: 'FakeEvent' }));
    assert.throws(() => handleHook(fixture, { hook_event_name: 'SessionStart' }));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('hooks report missing services, remain idempotent and avoid recursive stop work', () => {
  const fixture = createFixture();
  try {
    const start = { cwd: fixture, hook_event_name: 'SessionStart' };
    assert.deepEqual(handleHook(fixture, start), handleHook(fixture, start));
    assert.match(JSON.stringify(handleHook(fixture, start)), /CodeGraph unavailable/);
    for (const event of ['PostToolUse', 'SessionEnd']) {
      assert.deepEqual(handleHook(fixture, { cwd: fixture, hook_event_name: event }), {});
    }
    assert.deepEqual(
      handleHook(fixture, { cwd: fixture, hook_event_name: 'Stop', stop_hook_active: true }),
      {},
    );
    assert.match(
      JSON.stringify(handleHook(fixture, { cwd: fixture, hook_event_name: 'PreCompact' })),
      /handoff/,
    );
    assert.match(
      JSON.stringify(handleHook(fixture, { cwd: fixture, hook_event_name: 'Stop' })),
      /checks/,
    );
    assert.deepEqual(handleHook(fixture, { cwd: fixture, hook_event_name: 'PreToolUse' }), {});
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('available package probes do not pretend a connected service or scope was verified', () => {
  const fixture = createFixture();
  try {
    mkdirSync(join(fixture, 'node_modules/.bin'), { recursive: true });
    mkdirSync(join(fixture, 'node_modules/opencode-mem'), { recursive: true });
    writeFileSync(join(fixture, 'node_modules/.bin/codegraph'), 'fixture');
    writeFileSync(join(fixture, 'node_modules/opencode-mem/package.json'), '{}');
    const startResult = handleHook(fixture, { cwd: fixture, hook_event_name: 'SessionStart' }) as {
      hookSpecificOutput?: { additionalContext?: string };
    };
    assert.match(
      startResult.hookSpecificOutput?.additionalContext || '',
      /opencode-mem unavailable/,
    );
    rmSync(join(fixture, 'node_modules/.bin/codegraph'));
    symlinkSync(projectRoot, join(fixture, 'node_modules/.bin/codegraph'), 'junction');
    const startResult2 = handleHook(fixture, { cwd: fixture, hook_event_name: 'SessionStart' }) as {
      hookSpecificOutput?: { additionalContext?: string };
    };
    assert.match(startResult2.hookSpecificOutput?.additionalContext || '', /CodeGraph unavailable/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

function assertDocumentationSkillValidation(fixture: string): void {
  const source = join(fixture, '.agents/skills/documentation/SKILL.md');
  const content = readFileSync(source, 'utf8');
  rmSync(source);
  assert.throws(() => validate(fixture), /Skill source missing: documentation/);
  for (const invalid of ['---\nname: wrong\n---\n', `${content}\nGenerated Claude adapter.\n`]) {
    writeFileSync(source, invalid);
    assert.throws(() => validate(fixture), /Canonical skill instructions missing: documentation/);
  }
  writeFileSync(source, content);
  const instructionsPath = join(fixture, 'AGENTS.md');
  const instructions = readFileSync(instructionsPath, 'utf8');
  writeFileSync(
    instructionsPath,
    instructions.replaceAll('.agents/skills/documentation/SKILL.md', 'missing'),
  );
  assert.throws(() => validate(fixture), /Skill reference missing: documentation/);
  writeFileSync(instructionsPath, instructions);
  const legacy = join(fixture, '.agents/skills/documentation.md');
  writeFileSync(legacy, 'Obsolete duplicate');
  assert.throws(() => validate(fixture), /Obsolete duplicate skill source: documentation/);
  rmSync(legacy);
  assert.doesNotThrow(() => validate(fixture));
}

void test('validation preserves canonical skills and rejects obsolete duplicate sources', () => {
  const fixture = createFixture();
  try {
    for (const name of [
      'architecture',
      'testing',
      'security',
      'release',
      'git-safety',
      'documentation',
    ]) {
      const relative = `.agents/skills/${name}/SKILL.md`;
      mkdirSync(join(fixture, '.agents/skills', name), { recursive: true });
      writeFileSync(join(fixture, relative), readFileSync(join(projectRoot, relative), 'utf8'));
    }
    mkdirSync(join(fixture, '.claude'), { recursive: true });
    mkdirSync(join(fixture, '.codex'), { recursive: true });
    for (const file of [
      'AGENTS.md',
      'opencode.json',
      '.claude/settings.json',
      '.codex/hooks.json',
      'CLAUDE.md',
    ]) {
      writeFileSync(join(fixture, file), readFileSync(join(projectRoot, file), 'utf8'));
    }
    assert.doesNotThrow(() => validate(fixture));
    const source = join(fixture, '.agents/skills/architecture/SKILL.md');
    const content = `${readFileSync(source, 'utf8')}\nVerified project-specific instructions.\n`;
    writeFileSync(source, content);
    assert.doesNotThrow(() => validate(fixture));
    const legacy = join(fixture, '.agents/skills/architecture.md');
    writeFileSync(legacy, 'Obsolete duplicate');
    assert.throws(() => validate(fixture), /Obsolete duplicate skill source/);
    rmSync(legacy);
    writeFileSync(source, '---\nname: architecture\n---\n\nGenerated Claude adapter.\n');
    assert.throws(() => validate(fixture), /Canonical skill instructions missing/);
    writeFileSync(source, content);
    assertDocumentationSkillValidation(fixture);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('validation checks real platform configuration files', () => {
  const fixture = createFixture();
  try {
    mkdirSync(join(fixture, '.claude'), { recursive: true });
    mkdirSync(join(fixture, '.codex'), { recursive: true });
    // Create required skill files first
    for (const name of [
      'architecture',
      'testing',
      'security',
      'release',
      'git-safety',
      'documentation',
    ]) {
      const relative = `.agents/skills/${name}/SKILL.md`;
      mkdirSync(join(fixture, '.agents/skills', name), { recursive: true });
      writeFileSync(join(fixture, relative), readFileSync(join(projectRoot, relative), 'utf8'));
    }
    for (const file of ['AGENTS.md', 'opencode.json']) {
      writeFileSync(join(fixture, file), readFileSync(join(projectRoot, file), 'utf8'));
    }
    assert.throws(() => validate(fixture), /Claude settings missing/);
    writeFileSync(join(fixture, '.claude/settings.json'), '{}');
    assert.throws(() => validate(fixture), /Claude hooks configuration missing or invalid/);
    writeFileSync(
      join(fixture, '.claude/settings.json'),
      readFileSync(join(projectRoot, '.claude/settings.json'), 'utf8'),
    );
    assert.throws(() => validate(fixture), /Codex hooks missing/);
    writeFileSync(
      join(fixture, '.codex/hooks.json'),
      readFileSync(join(projectRoot, '.codex/hooks.json'), 'utf8'),
    );
    // Write CLAUDE.md that doesn't import AGENTS.md first
    writeFileSync(join(fixture, 'CLAUDE.md'), '# Not importing');
    assert.throws(() => validate(fixture), /CLAUDE.md must import/);
    // Now write proper CLAUDE.md
    writeFileSync(join(fixture, 'CLAUDE.md'), '@AGENTS.md');
    assert.doesNotThrow(() => validate(fixture));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

void test('native command entry point emits context and exit 2 for rejected inputs', () => {
  const script = join(projectRoot, 'scripts/agents/hook.ts');
  const start = spawnSync(process.execPath, [script], {
    input: JSON.stringify({ cwd: projectRoot, hook_event_name: 'SessionStart' }),
    encoding: 'utf8',
  });
  assert.equal(start.status, 0);
  assert.match(start.stdout, /additionalContext/);
  for (const input of [
    'invalid',
    JSON.stringify({
      cwd: projectRoot,
      hook_event_name: 'PreToolUse',
      tool_input: { command: 'git push' },
    }),
  ]) {
    const blocked = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
    assert.equal(blocked.status, 2);
    assert.match(blocked.stderr, /rejected/);
  }
});

void test('no auto-loaded agent-infrastructure plugin in .opencode/plugins/', () => {
  const pluginDir = join(projectRoot, '.opencode/plugins');
  const entries = existsSync(pluginDir) ? readdirSync(pluginDir, { withFileTypes: true }) : [];
  // Local deployment is optional; unauthorized plugin entries remain forbidden.
  // No loose .ts/.js plugin files should exist
  const loosePlugins = entries.filter(
    (e) => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js')),
  );
  assert.equal(loosePlugins.length, 0, 'No loose plugin files allowed in .opencode/plugins/');
  // No other plugin directories
  const otherDirs = entries.filter((e) => e.isDirectory() && e.name !== 'opencode-quotaweave');
  assert.equal(otherDirs.length, 0, 'No other plugin directories allowed');
});
