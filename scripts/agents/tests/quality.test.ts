import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { architecture } from '../../quality/architecture.ts';
import { allSourceFiles, explicitSourceFiles, isSource } from '../../quality/files.ts';
import { measure } from '../../quality/measure.ts';
import { syntaxCheck } from '../../quality/syntax.ts';
import { projectRoot } from '../workspace.ts';
let fixture: string;
before(() => {
  mkdirSync(join(projectRoot, 'scripts/agents/.fixtures'), { recursive: true });
  fixture = mkdtempSync(join(projectRoot, 'scripts/agents/.fixtures/quality-'));
  for (const pkg of ['core', 'opencode-plugin', 'mcp-server'])
    mkdirSync(join(fixture, `packages/${pkg}/src`), { recursive: true });
  mkdirSync(join(fixture, 'scripts'));
  writeFileSync(join(fixture, 'packages/core/package.json'), '{"exports":{".":"./dist/index.js"}}');
});
after(() => rmSync(fixture, { recursive: true, force: true }));

void test('code-line measurement matches native ESLint counting at the hard limit', () => {
  const source =
    '// comment\n\nconst one = 1; // inline comment\n/* full\n block */\nconst text = "any";\n';
  assert.deepEqual(measure(source), { codeLines: 2, explicitAny: false });
  assert.equal(measure('let value: any;').explicitAny, true);
  assert.equal(measure('const view = <text>any</text>;', 'source.tsx').explicitAny, false);
  const atLimit = Array.from({ length: 300 }, (_, index) => `const value${index} = ${index};`).join(
    '\n',
  );
  assert.equal(syntaxCheck(atLimit, 'source.ts').length, 0);
  assert.ok(
    syntaxCheck(`${atLimit}\nconst extra = 1;`, 'source.ts').some(
      (issue) => issue.ruleId === 'max-lines',
    ),
  );
  assert.throws(() => measure('const = ;'), /Cannot parse/);
});
void test('structural rules reject long functions, excessive parameters, depth and explicit any', () => {
  const body = Array.from({ length: 51 }, () => 'value++;').join('\n');
  assert.ok(
    syntaxCheck(`function work(value: number) {\n${body}\n}`, 'source.ts').some(
      (issue) => issue.ruleId === 'max-lines-per-function',
    ),
  );
  assert.ok(
    syntaxCheck('function work(a,b,c,d,e) {}', 'source.ts').some(
      (issue) => issue.ruleId === 'max-params',
    ),
  );
  assert.ok(
    syntaxCheck('if(a){if(b){if(c){if(d){work();}}}}', 'source.ts').some(
      (issue) => issue.ruleId === 'max-depth',
    ),
  );
  assert.ok(
    syntaxCheck('let value: any;', 'source.ts').some(
      (issue) => issue.ruleId === '@typescript-eslint/no-explicit-any',
    ),
  );
});
void test('architecture checks reject forbidden direction, deep imports and runtime cycles', () => {
  writeFileSync(
    join(fixture, 'packages/core/src/one.ts'),
    "import { two } from './two.js'; export const one = two;",
  );
  writeFileSync(
    join(fixture, 'packages/core/src/two.ts'),
    "import { one } from './one.js'; export const two = one;",
  );
  writeFileSync(
    join(fixture, 'packages/opencode-plugin/src/bridge.ts'),
    "import { hidden } from '@opencode-quotaweave/core/src/hidden'; import '@opencode-quotaweave/mcp-server';",
  );
  const issues = architecture(fixture, allSourceFiles(fixture));
  assert.ok(issues.some((issue) => issue.message.includes('Runtime module cycle')));
  assert.ok(issues.some((issue) => issue.message.includes('Non-public package import')));
  assert.ok(issues.some((issue) => issue.message.includes('Forbidden package dependency')));
});
void test('architecture allows type-only cycles but rejects core runtime and relative package dependencies', () => {
  writeFileSync(
    join(fixture, 'packages/core/src/one.ts'),
    "import type { Two } from './two.js'; export type One = Two;",
  );
  writeFileSync(
    join(fixture, 'packages/core/src/two.ts'),
    "import type { One } from './one.js'; export type Two = One;",
  );
  writeFileSync(
    join(fixture, 'packages/opencode-plugin/src/bridge.ts'),
    "import type { One } from '@opencode-quotaweave/core';",
  );
  assert.deepEqual(architecture(fixture, allSourceFiles(fixture)), []);
  writeFileSync(
    join(fixture, 'packages/core/src/one.ts'),
    "import 'node:fs'; import '../../opencode-plugin/src/bridge.js';",
  );
  const issues = architecture(fixture, allSourceFiles(fixture));
  assert.ok(issues.some((issue) => issue.message.includes('Core cannot depend')));
  assert.ok(issues.some((issue) => issue.message.includes('Cross-package relative import')));
});
void test('source inventory excludes generated data and refuses explicit private or outside paths', () => {
  mkdirSync(join(fixture, 'packages/core/dist'));
  writeFileSync(join(fixture, 'packages/core/dist/generated.ts'), 'export {};');
  const files = allSourceFiles(fixture);
  assert.ok(!files.some((file) => file.includes('dist')));
  assert.ok(isSource('file.tsx'));
  assert.ok(!isSource('file.test.js'));
  assert.deepEqual(explicitSourceFiles(fixture, ['packages/core/src/one.ts']), [
    'packages/core/src/one.ts',
  ]);
  assert.throws(() => explicitSourceFiles(fixture, ['../outside.ts']));
  assert.throws(() => explicitSourceFiles(fixture, ['dev.route.json']));
  assert.throws(() => explicitSourceFiles(fixture, ['missing.ts']));
});
