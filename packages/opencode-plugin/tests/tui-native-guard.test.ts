import { limits } from '../../../scripts/quality/limits.ts';
import { measure } from '../../../scripts/quality/measure.ts';
/**
 * Guardrails for the native QuotaWeave interface.
 *
 * These checks protect the migration's architectural invariants: host-managed
 * dismissal, semantic theme tokens, and no secondary renderer or global Escape
 * interception.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const tuiDir = path.join(testsDir, '../src/tui');
function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}
const files = sourceFiles(tuiDir);
const source = files
  .map((file) => `\n// ${path.relative(tuiDir, file)}\n${fs.readFileSync(file, 'utf8')}`)
  .join('');
describe('native TUI guardrails', describeNativeTUIGuardrails0);
function itUsesTheHostDialogInsteadOfA1() {
  expect(source).toMatch(/ui\.dialog\.show/);
  expect(source).toMatch(/ui\.dialog\.set/);
  expect(source).not.toContain('ui.router.register');
  expect(source).not.toContain('createCliRenderer');
  expect(source).not.toContain('@opentui/core/testing');
}
function itKeepsTabSelectionWiredToHostMouse2() {
  const tabBar = fs.readFileSync(path.join(tuiDir, 'dialog/TabBar.tsx'), 'utf8');
  const tabKeys = fs.readFileSync(path.join(tuiDir, 'dialog/useTabKeymap.ts'), 'utf8');
  expect(tabBar).toContain('onMouseDown');
  expect(tabBar).toContain('onMouseUp');
  expect(tabBar).toContain('focusable={true}');
  expect(tabBar).toContain('on:focused');
  expect(tabBar).toContain('active={item.id === props.active}');
  expect(tabBar).toContain('compact');
  expect(tabKeys).toContain("mode: 'modal'");
  expect(tabKeys).toContain("bind: 'right'");
  expect(tabKeys).toContain("bind: 'return'");
  expect(tabKeys).toContain("bind: 'space'");
  expect(tabKeys).not.toContain("bind: 'escape'");
  const layout = fs.readFileSync(path.join(tuiDir, 'dialog/DialogLayout.tsx'), 'utf8');
  expect(layout).toContain('when={props.state.view()} keyed');
  expect(layout).toContain('view');
  expect(layout).not.toContain("mode: 'base'");
  expect(layout).not.toContain('alt+');
  expect(layout).not.toContain('ctrl+left');
  expect(layout).not.toContain('ctrl+right');
  expect(layout).not.toContain('VIEW_KEYS');
  const tabBarView = fs.readFileSync(path.join(tuiDir, 'dialog/DialogLayout.tsx'), 'utf8');
  expect(tabBarView).toContain('resolveNavigationDensity');
  const renderView = fs.readFileSync(path.join(tuiDir, 'dialog/render-view.tsx'), 'utf8');
  expect(renderView).toContain('OverviewView');
  expect(renderView).toContain('ModelExplorerView');
  expect(renderView).toContain('RoutingView');
  expect(renderView).toContain('SimulationView');
}
function itDoesNotBindEscapeOrInstallA3() {
  expect(source).not.toMatch(/bind:\s*['"]escape['"]/);
  const dialogSource = files
    .filter((file) => file.includes(`${path.sep}dialog${path.sep}`))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  expect(dialogSource).not.toContain("mode: 'global'");
  expect(dialogSource).toContain("mode: 'modal'");
}
function itUsesSemanticThemeTokensOnly4() {
  expect(source).not.toContain('var(--');
  expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  expect(source).not.toMatch(/mode:\s*['"]dark['"]/);
  expect(source).not.toMatch(/mode:\s*['"]light['"]/);
  expect(source).not.toContain('backgroundColor="');
  expect(source).not.toMatch(/\p{Extended_Pictographic}/u);
}
function itContainsNoDebugLoggingOrExplicitAny5() {
  expect(source).not.toContain('console.log');
  for (const file of files) {
    expect(
      measure(fs.readFileSync(file, 'utf8'), file).explicitAny,
      path.relative(tuiDir, file),
    ).toBe(false);
  }
}
function itKeepsEveryHandwrittenUIFileWithinThe6() {
  for (const file of files) {
    const lines = measure(fs.readFileSync(file, 'utf8'), file).codeLines;
    expect(lines, path.relative(tuiDir, file)).toBeLessThanOrEqual(limits.file);
  }
}
function describeNativeTUIGuardrails0() {
  it(
    'uses the host dialog instead of a custom route renderer or renderer',
    itUsesTheHostDialogInsteadOfA1,
  );
  it(
    'keeps tab selection wired to host mouse and modal keymap events',
    itKeepsTabSelectionWiredToHostMouse2,
  );
  it('does not bind Escape or install a global dashboard keymap', itDoesNotBindEscapeOrInstallA3);
  it('uses semantic theme tokens only', itUsesSemanticThemeTokensOnly4);
  it('contains no debug logging or explicit any types', itContainsNoDebugLoggingOrExplicitAny5);
  it(
    'keeps every handwritten UI file within the project file limit',
    itKeepsEveryHandwrittenUIFileWithinThe6,
  );
}
