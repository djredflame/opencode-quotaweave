import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Regression tests for Routing category selection.
 *
 * RoutingView owns a reactive category pool; selecting another category must
 * update the inspector immediately without a tab switch or remount.
 */
import {
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
  type RoutingCategoryId,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot, createSignal } from 'solid-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
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
}
vi.mock('@opentui/solid', async () => {
  const { createMemo, createRenderEffect } = await import('solid-js');
  const unwrap = (value: unknown): unknown => {
    if (isCallable(value)) return unwrap(value());
    if (Array.isArray(value)) return value.map(unwrap);
    return value;
  };
  return {
    createElement: (tag: string): VirtualNode => ({ tag, props: {}, children: [] }),
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
    useTerminalDimensions: () => () => ({ width: 160, height: 40 }),
  };
});
vi.mock('../src/tui/components/routing/RoutingSummaryBar.js', () => ({
  RoutingSummaryBar: () => ({ marker: 'summary' }),
}));
vi.mock('../src/tui/components/routing/RoutingCategoryList.js', () => ({
  RoutingCategoryList: () => ({ marker: 'list' }),
}));
vi.mock('../src/tui/components/routing/RoutingCategoryInspector.js', async () => {
  const { createRenderEffect } = await import('solid-js');
  return {
    RoutingCategoryInspector: (props: {
      pool: {
        id: string;
      };
    }) => {
      const node = { marker: 'inspector', categoryId: '' };
      createRenderEffect(() => {
        node.categoryId = props.pool.id;
      });
      return node;
    },
  };
});
const { RoutingView } = await import('../src/tui/views/RoutingView.js');
function findMarker(node: unknown, marker: string): Record<string, unknown> | undefined {
  if (node === null || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findMarker(child, marker);
      if (found) return found;
    }
    return undefined;
  }
  const record = node as {
    marker?: string;
    children?: unknown[];
  };
  if (record.marker === marker) return record;
  if (record.children) return findMarker(record.children, marker);
  return undefined;
}
function mountRouting(initial: RoutingCategoryId) {
  return createRoot((dispose) => {
    const [selectedCategory, setSelectedCategory] = createSignal<RoutingCategoryId>(initial);
    const tree = RoutingView({
      config,
      get selectedCategory() {
        return selectedCategory();
      },
      listScrollTop: 0,
      detailScrollTop: 0,
      onSelectCategory: setSelectedCategory,
      onListScrollChange: () => undefined,
      onDetailScrollChange: () => undefined,
    });
    return { tree, selectedCategory, setSelectedCategory, dispose };
  });
}
describe('routing category reactivity', describeRoutingCategoryReactivity1);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itUpdatesTheInspectorImmediatelyWhenTheSelected2() {
  const routing = mountRouting('general');
  expect(findMarker(routing.tree, 'summary')).toBeDefined();
  expect(findMarker(routing.tree, 'list')).toBeDefined();
  expect(findMarker(routing.tree, 'inspector')?.categoryId).toBe('general');
  routing.setSelectedCategory('vision');
  expect(findMarker(routing.tree, 'inspector')?.categoryId).toBe('vision');
  routing.setSelectedCategory('coding');
  expect(findMarker(routing.tree, 'inspector')?.categoryId).toBe('coding');
  routing.dispose();
}
function describeRoutingCategoryReactivity1() {
  it(
    'updates the inspector immediately when the selected category changes',
    itUpdatesTheInspectorImmediatelyWhenTheSelected2,
  );
}
