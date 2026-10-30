import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { postEditFeedback } from '../post-edit-feedback.ts';
import { projectRoot } from '../workspace.ts';
let fixture: string;
before(() => {
  mkdirSync(join(projectRoot, 'scripts/agents/.fixtures'), { recursive: true });
  fixture = mkdtempSync(join(projectRoot, 'scripts/agents/.fixtures/post-edit-'));
});
after(() => rmSync(fixture, { recursive: true, force: true }));

void test('post-edit feedback measures source files and remains explicitly nonblocking', () => {
  writeFileSync(join(fixture, 'module.ts'), 'export const value = 1;\n');
  const payload = { cwd: fixture, tool_input: { file_path: 'module.ts' } };
  assert.match(JSON.stringify(postEditFeedback(fixture, payload)), /1\/300 code lines/);
  assert.match(JSON.stringify(postEditFeedback(fixture, payload)), /does not block or revert/);
  assert.deepEqual(postEditFeedback(fixture, payload), postEditFeedback(fixture, payload));
});
void test('patch feedback reports exceeded budgets without changing the file', () => {
  const source = Array.from({ length: 301 }, (_, index) => `const value${index} = 1;`).join('\n');
  writeFileSync(join(fixture, 'large.ts'), source);
  const result = postEditFeedback(fixture, {
    cwd: fixture,
    tool_input: '*** Update File: large.ts\n',
  });
  assert.match(JSON.stringify(result), /split this file before completion/);
  assert.deepEqual(
    postEditFeedback(fixture, { cwd: fixture, tool_input: { path: 'missing.ts' } }),
    {},
  );
  assert.throws(() =>
    postEditFeedback(fixture, { cwd: fixture, tool_input: { path: '../outside.ts' } }),
  );
  assert.throws(() =>
    postEditFeedback(fixture, { cwd: fixture, tool_input: { path: '.git/config' } }),
  );
});
void test('native post-edit command reports malformed input as advisory output', () => {
  const result = spawnSync(process.execPath, [join(projectRoot, 'scripts/agents/post-edit.ts')], {
    input: 'invalid',
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /feedback unavailable/);
});

void test('no auto-loaded agent-infrastructure plugin for post-edit hooks', () => {
  const pluginDir = join(projectRoot, '.opencode/plugins');
  const entries = existsSync(pluginDir) ? readdirSync(pluginDir, { withFileTypes: true }) : [];
  const loosePlugins = entries.filter(
    (e) => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js')),
  );
  assert.equal(loosePlugins.length, 0, 'No loose plugin files allowed for post-edit hooks');
});
