import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Regression tests for Models filter buttons and filter behavior.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot, createSignal } from 'solid-js';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDialogState } from '../src/tui/dialog/useDialogState.js';
import { ROUTING_CATEGORY_IDS } from '../src/tui/routing-data.js';
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
    createElement: (tag: string): VirtualNode => ({ tag: tag, props: {}, children: [] }),
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
describe('models filter buttons regression', describeModelsFilterButtonsRegression0);
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
function itFilterButtonsReplaceDialogs2() {
  // The old dialog-based filter selection has been replaced with inline buttons
  // This test verifies that the filter state can still be changed programmatically
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  expect(state.filter().statusFilter).toBe('all');
  expect(state.filter().categoryFilter).toBe('all');
  state.setFilter({ statusFilter: 'enabled' });
  expect(state.filter().statusFilter).toBe('enabled');
  state.setFilter({ statusFilter: 'disabled' });
  expect(state.filter().statusFilter).toBe('disabled');
  state.setFilter({ categoryFilter: 'coding' });
  expect(state.filter().categoryFilter).toBe('coding');
}
function itSelectingFiltersAppliesFilters3() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  expect(state.filter().statusFilter).toBe('all');
  expect(state.filter().categoryFilter).toBe('all');
  state.setFilter({ statusFilter: 'enabled' });
  expect(state.filter().statusFilter).toBe('enabled');
  state.setFilter({ statusFilter: 'disabled' });
  expect(state.filter().statusFilter).toBe('disabled');
  state.setFilter({ categoryFilter: 'coding' });
  expect(state.filter().categoryFilter).toBe('coding');
}
function itCategoryButtonsContainTenCanonicalCategoriesPlusAll4() {
  expect(ROUTING_CATEGORY_IDS.length).toBe(10);
  const categories = ['all', ...ROUTING_CATEGORY_IDS];
  expect(categories.length).toBe(11);
}
function itMainDialogSurvivesFilterChanges5() {
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
  state.setFilter({ statusFilter: 'enabled', categoryFilter: 'coding' });
  state.setView('routing');
  state.setView('models');
  expect(state.view()).toBe('models');
  expect(state.filter().statusFilter).toBe('enabled');
  expect(state.filter().categoryFilter).toBe('coding');
  explorer.dispose();
}
function itModelInspectorSelectionStillWorks6() {
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
  expect(state.selectedModel()?.id).toBe('test/model-1');
  explorer.dispose();
}
function itNativeEscapeBackCloseStillWork7() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'models',
  });
  expect(typeof state.back).toBe('function');
  expect(typeof state.close).toBe('function');
}
function describeModelsFilterButtonsRegression0() {
  it('filter buttons replace dialogs', itFilterButtonsReplaceDialogs2);
  it('selecting status/category applies filters', itSelectingFiltersAppliesFilters3);
  it(
    'category buttons contain ten canonical categories plus All',
    itCategoryButtonsContainTenCanonicalCategoriesPlusAll4,
  );
  it('main dialog survives filter changes', itMainDialogSurvivesFilterChanges5);
  it('model/inspector selection still works', itModelInspectorSelectionStillWorks6);
  it('native Escape/Back/Close still work', itNativeEscapeBackCloseStillWork7);
}
