/** Structural checks supplement, but do not replace, real host runtime verification. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { limits } from '../quality/limits.ts';
import { projectRoot, record, safePath } from './workspace.ts';
import { checkOpenCode } from './validate-opencode.ts';

const CANONICAL_SKILLS = [
  'architecture',
  'testing',
  'security',
  'release',
  'git-safety',
  'documentation',
] as const;
const ALLOWED_OPENCODE_PLUGIN_DIRS = ['opencode-quotaweave'] as const;

export function validate(root: string): void {
  const instructions = readFileSync(safePath(root, 'AGENTS.md'), 'utf8');
  if (!instructions.includes('## 10. Shared agent workflow'))
    throw new Error('Shared workflow missing');
  const documented = [
    `${limits.file} code lines per file`,
    `${limits.function} code lines per function`,
    `${limits.parameters} parameters`,
    `${limits.depth} nesting levels`,
  ];
  if (documented.some((phrase) => !instructions.includes(phrase)))
    throw new Error('Documented code limits differ from the executable policy');
  for (const name of CANONICAL_SKILLS) {
    const source = `.agents/skills/${name}/SKILL.md`;
    if (!instructions.includes(source)) throw new Error(`Skill reference missing: ${name}`);
    if (!existsSync(safePath(root, source))) throw new Error(`Skill source missing: ${name}`);
    if (existsSync(safePath(root, `.agents/skills/${name}.md`)))
      throw new Error(`Obsolete duplicate skill source: ${name}`);
    const content = readFileSync(safePath(root, source), 'utf8').replace(/\r\n/g, '\n');
    if (!content.includes(`name: ${name}\n`) || /^Generated (?:Claude )?adapter\./m.test(content))
      throw new Error(`Canonical skill instructions missing: ${name}`);
  }
  checkClaudeSettings(root);
  checkCodexHooks(root);
  checkClaudeMd(root);
  checkOpenCode(root);
  checkScriptCommands(root);
  checkOpenCodePluginDirectory(root);
  for (const directory of ['packages', '.agents', '.claude', '.codex', '.opencode']) {
    rejectInstructionRoots(root, directory);
  }
}

function checkClaudeSettings(root: string): void {
  const path = safePath(root, '.claude/settings.json');
  if (!existsSync(path)) throw new Error('Claude settings missing: .claude/settings.json');
  const config = record(JSON.parse(readFileSync(path, 'utf8')));
  if (!config.hooks || typeof config.hooks !== 'object')
    throw new Error('Claude hooks configuration missing or invalid');
  const hooks = record(config.hooks);
  for (const event of ['SessionStart', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop']) {
    if (!(event in hooks)) throw new Error(`Claude hook event missing: ${event}`);
  }
}

function checkCodexHooks(root: string): void {
  const path = safePath(root, '.codex/hooks.json');
  if (!existsSync(path)) throw new Error('Codex hooks missing: .codex/hooks.json');
  const config = record(JSON.parse(readFileSync(path, 'utf8')));
  if (!config.hooks || typeof config.hooks !== 'object')
    throw new Error('Codex hooks configuration missing or invalid');
  const hooks = record(config.hooks);
  for (const event of ['SessionStart', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop']) {
    if (!(event in hooks)) throw new Error(`Codex hook event missing: ${event}`);
  }
}

function checkClaudeMd(root: string): void {
  const path = safePath(root, 'CLAUDE.md');
  if (!existsSync(path)) throw new Error('CLAUDE.md missing');
  const content = readFileSync(path, 'utf8');
  if (!content.includes('AGENTS.md')) throw new Error('CLAUDE.md must import AGENTS.md');
}

function checkScriptCommands(root: string): void {
  for (const directory of [
    '',
    ...readdirSync(safePath(root, 'packages')).map((name) => `packages/${name}`),
  ]) {
    const manifest = record(
      JSON.parse(readFileSync(safePath(root, join(directory, 'package.json')), 'utf8')),
    );
    const scripts = record(manifest.scripts);
    for (const command of Object.values(scripts)) {
      if (typeof command !== 'string') throw new Error('Invalid package script');
      if (
        /\b(?:git|gh)\s+(?:add|commit|push|fetch|pull|reset|checkout|switch|merge|rebase|release|pr)\b/.test(
          command,
        )
      ) {
        throw new Error('Forbidden Git/GitHub mutation in package script');
      }
    }
  }
}

function checkOpenCodePluginDirectory(root: string): void {
  const pluginDir = safePath(root, '.opencode/plugins');
  if (!existsSync(pluginDir)) return;
  const entries = readdirSync(pluginDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      throw new Error(
        `Unauthorized plugin file in .opencode/plugins/: ${entry.name}. Only the QuotaWeave development plugin directory is allowed.`,
      );
    }
    if (
      entry.isDirectory() &&
      !ALLOWED_OPENCODE_PLUGIN_DIRS.includes(entry.name as 'opencode-quotaweave')
    ) {
      throw new Error(
        `Unauthorized plugin directory in .opencode/plugins/: ${entry.name}. Only opencode-quotaweave is allowed.`,
      );
    }
  }
}

function rejectInstructionRoots(root: string, directory: string): void {
  const path = safePath(root, directory);
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error('Infrastructure/source directory contains a symlink');
    if (['node_modules', 'dist', 'coverage', 'memories'].includes(entry.name)) continue;
    if (entry.name === 'AGENTS.md')
      throw new Error('Unexpected nested instruction root; review precedence explicitly');
    if (entry.isDirectory()) rejectInstructionRoots(root, `${directory}/${entry.name}`);
  }
}

if (process.argv[1]?.endsWith('/validate.ts') || process.argv[1]?.endsWith('\\validate.ts')) {
  try {
    validate(projectRoot);
    process.stdout.write('Agent infrastructure references and permissions validated.\n');
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Infrastructure validation failed'}\n`,
    );
    process.exitCode = 1;
  }
}
