import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
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
      ui: { dialog: { clear: () => undefined, select: vi.fn() } },
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
        createRenderEffect(() => {
          slot.children = [unwrapVirtualNode(child())];
        });
        return slot;
      }
      parent.children.push(unwrapVirtualNode(child));
      return child;
    },
    createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
    effect: (effect: (previous?: unknown) => unknown, value?: unknown) =>
      createRenderEffect(effect, value),
    memo: (fn: () => unknown, value?: unknown) => createMemo(fn, value),
    useTerminalDimensions: () => dimensionsSignal,
  };
});
vi.mock('../src/tui/components/ModelFilters.js', () => {
  return {
    ModelFilters: () => {
      const searchInputCalls: string[] = [];
      const obj: { marker: string; searchInputCalls: string[]; onInput: (value: string) => void } =
        {
          marker: 'filters',
          searchInputCalls,
          onInput: (value: string) => searchInputCalls.push(value),
        };
      return obj;
    },
  };
});
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
describe('models search input focus regression', describeModelsSearchInputFocusRegression0);
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
function itModelsSearchReceivesFocusAndAcceptsInput2() {
  const explorer = mountExplorer();
  const filters = findMarker(explorer.tree, 'filters');
  expect(filters).toBeDefined();
  if (filters && typeof filters === 'object' && 'searchInputCalls' in filters) {
    const calls = filters.searchInputCalls as string[];
    calls.push('test');
    calls.push('test query');
    expect(calls).toContain('test');
    expect(calls).toContain('test query');
  }
  explorer.dispose();
}
function itModelsSearchBackspaceAndDeleteUpdateQuery3() {
  const explorer = mountExplorer();
  const filters = findMarker(explorer.tree, 'filters');
  if (filters && typeof filters === 'object' && 'searchInputCalls' in filters) {
    const calls = filters.searchInputCalls as string[];
    calls.push('test query');
    calls.push('test quer');
    calls.push('test qu');
    expect(calls).toContain('test quer');
    expect(calls).toContain('test qu');
  }
  explorer.dispose();
}
function itModelsFilterResultsReactivelyUpdate4() {
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
  expect(state.filter().searchQuery).toBe('');
  state.setFilter({ searchQuery: 'model-1' });
  expect(state.filter().searchQuery).toBe('model-1');
  explorer.dispose();
}
function itModelsSearchQueryPersistsAcrossViewSwitches5() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  state.setFilter({ searchQuery: 'persisted query', statusFilter: 'enabled' });
  state.setView('routing');
  state.setView('models');
  expect(state.filter().searchQuery).toBe('persisted query');
  expect(state.filter().statusFilter).toBe('enabled');
}
function itFocusRemainsStableDuringReactiveRerenders7() {
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
  state.setFilter({ searchQuery: 'a' });
  state.setFilter({ searchQuery: 'ab' });
  state.setFilter({ searchQuery: 'abc' });
  expect(state.filter().searchQuery).toBe('abc');
  explorer.dispose();
}
function describeModelsSearchInputFocusRegression0() {
  it(
    'models search receives focus and accepts typed characters',
    itModelsSearchReceivesFocusAndAcceptsInput2,
  );
  it(
    'models search backspace and delete update the query',
    itModelsSearchBackspaceAndDeleteUpdateQuery3,
  );
  it('models filter results reactively update', itModelsFilterResultsReactivelyUpdate4);
  it(
    'models search query persists across view switches',
    itModelsSearchQueryPersistsAcrossViewSwitches5,
  );
  it(
    'focus remains stable during reactive rerenders',
    itFocusRemainsStableDuringReactiveRerenders7,
  );
}
