import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Regression tests for immediate model-inspector reactivity.
 *
 * The original implementation selected the detail pane once when the view
 * mounted. Selecting another model only changed state, so the inspector stayed
 * on its initial contents until a tab switch remounted the view. These tests
 * mount the real ModelExplorerView with a reactive selection accessor and
 * verify that the inspector follows every selection.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot, createSignal, createMemo } from 'solid-js';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDialogState } from '../src/tui/dialog/useDialogState.js';
import { DEFAULT_MODEL_FILTER, findModel } from '../src/tui/state.js';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const viewport = { width: 160, height: 40 };
const [dimensionsSignal, setDimensionsSignal] = createSignal({
  width: viewport.width,
  height: viewport.height,
});
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
beforeEach(beforeEachBeforeEach1);
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
  const { createMemo, createRenderEffect: cre } = await import('solid-js');
  const unwrapVirtualNode = (value: unknown): unknown => {
    if (isCallable(value)) return unwrapVirtualNode(value());
    if (Array.isArray(value)) return value.map(unwrapVirtualNode);
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
      parent.children.push(child);
    },
    insert: (parent: VirtualNode, child: unknown) => {
      if (isCallable(child)) {
        const slot = { props: {}, children: [] as unknown[] };
        parent.children.push(slot);
        cre(() => {
          slot.children = [unwrapVirtualNode(child())];
        });
        return slot;
      }
      parent.children.push(unwrapVirtualNode(child));
      return child;
    },
    createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
    effect: (effect: (previous?: unknown) => unknown, value?: unknown) => cre(effect, value),
    memo: (fn: () => unknown, value?: unknown) => createMemo(fn, value),
    useTerminalDimensions: () => dimensionsSignal,
  };
});
vi.mock('solid-js', async () => {
  const solid = await vi.importActual('solid-js');
  const { createMemo, createRenderEffect } = await import('solid-js');
  return {
    ...solid,
    Show: (props: {
      when?: unknown;
      fallback?: unknown;
      children?: (value: unknown) => unknown;
    }) => {
      // Create a memo that reacts to when() changes
      const conditionMemo = createMemo(() => {
        const when = props.when;
        return typeof when === 'function' ? (when as () => unknown)() : when;
      });

      // Return a reactive node that updates when condition changes
      const node: { marker: string; children: unknown[] } = { marker: 'show', children: [] };
      createRenderEffect(() => {
        const condition = conditionMemo();
        const fallback = props.fallback;
        const children = props.children;
        if (condition) {
          node.children = [typeof children === 'function' ? children(condition) : children];
        } else {
          node.children = [fallback];
        }
      });
      return node;
    },
  };
});
vi.mock('../src/tui/components/ModelFilters.js', () => ({
  ModelFilters: () => ({ marker: 'filters' }),
}));
vi.mock('../src/tui/components/ModelList.js', () => ({
  ModelList: () => ({ marker: 'list' }),
}));
vi.mock('../src/tui/components/ModelDetailView.js', async () => {
  const { createRenderEffect } = await import('solid-js');
  return {
    ModelDetailView: (props: {
      model: {
        id: string;
      };
    }) => {
      const node = { marker: 'detail', modelId: '' };
      createRenderEffect(() => {
        node.modelId = props.model.id;
      });
      return node;
    },
  };
});
const { ModelExplorerView } = await import('../src/tui/views/ModelExplorerView.js');
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
function mountExplorer(initialId: string | null = null) {
  return createRoot((dispose) => {
    const [selectedId, setSelectedId] = createSignal<string | null>(initialId);
    const [filter] = createSignal(DEFAULT_MODEL_FILTER);
    const selectedModel = createMemo(() => findModel(config, selectedId()));
    const tree = ModelExplorerView({
      config,
      filter,
      selectedModel,
      listScrollTop: 0,
      detailScrollTop: 0,
      onFilterChange: () => undefined,
      onSelectModel: setSelectedId,
      onClearModel: () => setSelectedId(null),
      onListScrollChange: () => undefined,
      onDetailScrollChange: () => undefined,
    });
    return { tree, selectedId, setSelectedId, filter, dispose };
  });
}
describe('model inspector reactivity', describeModelInspectorReactivity2);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function beforeEachBeforeEach1() {
  viewport.width = 160;
  setDimensionsSignal({ width: viewport.width, height: viewport.height });
}
function itUpdatesImmediatelyAfterMouseSelectionWithoutRemounting3() {
  const explorer = mountExplorer();
  expect(findMarker(explorer.tree, 'detail')).toBeUndefined();
  explorer.setSelectedId('test/model-1');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-1');
  explorer.setSelectedId('test/model-2');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-2');
  explorer.dispose();
}
function itUpdatesImmediatelyForKeyboardDrivenSelectionThrough4() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  const explorer = createRoot((dispose) => {
    const tree = ModelExplorerView({
      config,
      filter: state.filter,
      selectedModel: state.selectedModel,
      listScrollTop: 0,
      detailScrollTop: 0,
      onFilterChange: state.setFilter,
      onSelectModel: state.setSelectedModel,
      onClearModel: state.clearSelectedModel,
      onListScrollChange: () => undefined,
      onDetailScrollChange: () => undefined,
    });
    return { tree, dispose };
  });
  state.setSelectedModel('test/model-1');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-1');
  state.setSelectedModel('test/model-2');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-2');
  explorer.dispose();
}
function itKeepsSelectionAndInspectorContentAcrossA5() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  const explorer = createRoot((dispose) => {
    const tree = ModelExplorerView({
      config,
      filter: state.filter,
      selectedModel: state.selectedModel,
      listScrollTop: 0,
      detailScrollTop: 0,
      onFilterChange: state.setFilter,
      onSelectModel: state.setSelectedModel,
      onClearModel: state.clearSelectedModel,
      onListScrollChange: () => undefined,
      onDetailScrollChange: () => undefined,
    });
    return { tree, dispose };
  });
  state.setSelectedModel('test/model-2');
  state.setView('routing');
  state.setView('models');
  expect(state.selectedModel()?.id).toBe('test/model-2');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-2');
  explorer.dispose();
}
function itShowsTheDetailPaneImmediatelyInCompact6() {
  viewport.width = 90;
  setDimensionsSignal({ width: viewport.width, height: viewport.height });
  const explorer = mountExplorer();
  expect(findMarker(explorer.tree, 'list')).toBeDefined();
  expect(findMarker(explorer.tree, 'detail')).toBeUndefined();
  explorer.setSelectedId('test/model-1');
  expect(findMarker(explorer.tree, 'detail')?.modelId).toBe('test/model-1');
  expect(findMarker(explorer.tree, 'list')).toBeUndefined();
  explorer.dispose();
}
function itKeepsEmptyAndUnknownSelectionsSafe7() {
  const explorer = mountExplorer('missing/model');
  expect(explorer.selectedId()).toBe('missing/model');
  expect(findMarker(explorer.tree, 'detail')).toBeUndefined();
  explorer.setSelectedId(null);
  expect(findMarker(explorer.tree, 'detail')).toBeUndefined();
  explorer.dispose();
}
function describeModelInspectorReactivity2() {
  it(
    'updates immediately after mouse selection without remounting',
    itUpdatesImmediatelyAfterMouseSelectionWithoutRemounting3,
  );
  it(
    'updates immediately for keyboard-driven selection through dialog state',
    itUpdatesImmediatelyForKeyboardDrivenSelectionThrough4,
  );
  it(
    'keeps selection and inspector content across a tab round trip',
    itKeepsSelectionAndInspectorContentAcrossA5,
  );
  it(
    'shows the detail pane immediately in compact layouts',
    itShowsTheDetailPaneImmediatelyInCompact6,
  );
  it('keeps empty and unknown selections safe', itKeepsEmptyAndUnknownSelectionsSafe7);
}
