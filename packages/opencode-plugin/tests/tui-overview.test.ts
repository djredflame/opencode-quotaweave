import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Overview density and information-retention tests.
 *
 * The dashboard must stay compact while Routing owns the category explorer.
 * All main views are now implemented. System-related information has moved
 * to the dedicated System tab. Policy and cooldown details are in Policies.
 */
import {
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'solid-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const tuiDir = path.join(testsDir, '../src/tui');
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
vi.mock('@opencode/plugin/tui', () => {
  const color = '#ffffff';
  const theme = {
    text: {
      base: color,
      muted: color,
      faint: color,
      action: { primary: { base: color, focused: color, hovered: color } },
      feedback: {
        error: { base: color, muted: color },
        info: { base: color },
        success: { base: color },
        warning: { base: color },
      },
      formfield: { base: color, focused: color },
    },
    background: {
      action: {
        primary: { focused: color, hovered: color, selected: color },
        secondary: { hovered: color },
      },
      formfield: { base: color, focused: color },
      raised: { base: color, high: color },
    },
    scrollbar: { base: color },
  };
  return {
    usePlugin: () => ({
      theme,
      keymap: { layer: () => undefined },
      ui: { dialog: { clear: () => undefined } },
    }),
  };
});
interface VirtualNode {
  readonly tag: string;
  readonly props: Record<string, unknown>;
  readonly children: unknown[];
  readonly isDestroyed: boolean;
  focus: () => void;
  scrollTop: number;
  scrollChildIntoView: () => void;
}
vi.mock('@opentui/solid', async () => {
  const { createMemo, createRenderEffect } = await import('solid-js');
  const unwrap = (value: unknown): unknown => {
    if (isCallable(value)) return unwrap(value());
    if (Array.isArray(value)) return value.map(unwrap);
    return value;
  };
  const createElement = (tag: string): VirtualNode => ({
    tag,
    props: {},
    children: [],
    isDestroyed: false,
    focus: () => undefined,
    scrollTop: 0,
    scrollChildIntoView: () => undefined,
  });
  return {
    createElement,
    createTextNode: (text: string) => ({ text }),
    setProp: (element: VirtualNode, key: string, value: unknown) => {
      element.props[key] = value;
      if (key === 'ref' && isCallable(value)) value(element);
      return value;
    },
    insertNode: (parent: VirtualNode, child: unknown) => {
      parent.children.push(unwrap(child));
    },
    insert: (parent: VirtualNode, child: unknown) => {
      if (isCallable(child)) {
        const slot = { props: {}, children: [] as unknown[] };
        parent.children.push(slot);
        createRenderEffect(() => {
          slot.children = [unwrap(child())];
        });
        return slot;
      }
      parent.children.push(unwrap(child));
      return child;
    },
    createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
    effect: (effect: (previous?: unknown) => unknown, value?: unknown) =>
      createRenderEffect(effect, value),
    memo: (fn: () => unknown, value?: unknown) => createMemo(fn, value),
    use: (handler: (value: unknown) => void, value: unknown) => handler(value),
    useTerminalDimensions: () => () => ({ width: 120, height: 40 }),
  };
});
const { OverviewView } = await import('../src/tui/views/OverviewView.js');
function collectText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (node === null || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  const record = node as {
    text?: string;
    children?: unknown[];
  };
  if (record.text) return record.text;
  return record.children ? collectText(record.children) : '';
}
function mountOverview() {
  return createRoot((dispose) => {
    const tree = OverviewView({
      config,
      initialScrollTop: 0,
      onScrollPositionChange: () => undefined,
      onNavigate: () => undefined,
    });
    return { tree, dispose };
  });
}
describe('overview density', describeOverviewDensity1);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itStartsAsACompactDashboardWithoutRouting2() {
  const overview = mountOverview();
  const text = collectText(overview.tree);
  expect(text).toContain('STATUS');
  expect(text).toContain('Configuration');
  expect(text).toContain('MODELS');
  expect(text).toContain('ROUTING');
  expect(text).toContain('WARNINGS');
  expect(text).not.toContain('QUICK ACTIONS');
  expect(text).not.toContain('All main views are implemented');
  expect(text).not.toContain('COST POLICY');
  expect(text).not.toContain('COOLDOWNS & SHADOW');
  expect(text).not.toContain('AGENT MESH');
  expect(text).not.toContain('INTEGRATION LIMITS');
  expect(text).not.toContain('TEMPORARY DETAILS');
  expect(text).not.toContain('ROUTING SUMMARY');
  expect(text).not.toContain('Weights');
  overview.dispose();
}
function itKeepsTheCategoryExplorerAndWeightDetails3() {
  const overviewSource = fs.readFileSync(path.join(tuiDir, 'views/OverviewView.tsx'), 'utf8');
  const temporarySource = fs.readFileSync(
    path.join(tuiDir, 'components/overview/OverviewTemporaryDetails.tsx'),
    'utf8',
  );
  expect(overviewSource).not.toContain('RoutingCategoryList');
  expect(overviewSource).not.toContain('RoutingCategoryInspector');
  expect(overviewSource).not.toContain('buildCategoryPools');
  expect(overviewSource).not.toContain('OverviewTemporaryDetails');
  expect(temporarySource).toContain('OverviewConfiguration');
  expect(temporarySource).toContain('INTEGRATION LIMITS');
}
function describeOverviewDensity1() {
  it(
    'starts as a compact dashboard without routing configuration dumps',
    itStartsAsACompactDashboardWithoutRouting2,
  );
  it(
    'keeps the category explorer and weight details out of Overview sources',
    itKeepsTheCategoryExplorerAndWeightDetails3,
  );
}
