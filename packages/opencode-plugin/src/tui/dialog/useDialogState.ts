/**
 * Dialog state and actions for the shared QuotaWeave UI.
 */

import type { ModelConfig, RoutingCategoryId } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { createSignal, type Accessor } from 'solid-js';
import { initialRoutingCategory } from '../routing-data.js';
import {
  DEFAULT_MODEL_FILTER,
  backTarget,
  buildSimulationRequest,
  findModel,
  isRunnableTask,
} from '../state.js';
import type {
  ModelFilterState,
  QuotaWeaveDialogProps,
  QuotaWeaveView,
  SimulationSection,
  SimulationUiState,
} from '../types.js';
import {
  INITIAL_VIEW_SCROLL,
  rememberViewScroll,
  type ViewScrollKey,
  type ViewScrollState,
} from '../view-scroll.js';

/** State and actions consumed by the dialog layout. */
export interface DialogState {
  readonly view: Accessor<QuotaWeaveView>;
  readonly filter: Accessor<ModelFilterState>;
  readonly selectedModel: Accessor<ModelConfig | null>;
  readonly selectedCategory: Accessor<RoutingCategoryId>;
  readonly simulation: Accessor<SimulationUiState>;
  readonly scrollPosition: (key: ViewScrollKey) => number;
  readonly rememberScroll: (key: ViewScrollKey, offset: number) => void;
  readonly setView: (view: QuotaWeaveView) => void;
  readonly setFilter: (patch: Partial<ModelFilterState>) => void;
  readonly setSelectedModel: (modelId: string) => void;
  readonly clearSelectedModel: () => void;
  readonly setSelectedCategory: (category: RoutingCategoryId) => void;
  readonly setTask: (task: string) => void;
  readonly runSimulation: () => void;
  readonly dismissResult: () => void;
  readonly setSection: (section: SimulationSection) => void;
  readonly back: () => void;
  readonly close: () => void;
}

function initialSimulation(task: string | undefined): SimulationUiState {
  return { task: task ?? '', result: null, request: null, section: 'summary' };
}

/** Build all dialog state and actions. */
export function useDialogState(props: QuotaWeaveDialogProps): DialogState {
  const context = usePlugin();
  const [view, setView] = createSignal<QuotaWeaveView>(props.initialView);
  const [filter, setFilterSignal] = createSignal<ModelFilterState>(DEFAULT_MODEL_FILTER);
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [selectedCategory, setSelectedCategory] = createSignal<RoutingCategoryId>(
    initialRoutingCategory(props.session.config),
  );
  const [simulation, setSimulation] = createSignal<SimulationUiState>(
    initialSimulation(props.initialTask),
  );
  const [viewScroll, setViewScroll] = createSignal<ViewScrollState>(INITIAL_VIEW_SCROLL);
  const selectedModel = () => findModel(props.session.config, selectedId());

  const runSimulation = () => {
    const current = simulation();
    if (!isRunnableTask(current.task)) return;
    const request = buildSimulationRequest(current.task);
    const result = props.session.engine.simulate(request);
    setSimulation({ ...current, request, result, section: 'summary' });
  };

  const back = () => {
    if (backTarget(view()) === 'close') {
      context.ui.dialog.clear();
      return;
    }
    setView('overview');
  };

  return {
    view,
    filter,
    selectedModel,
    selectedCategory,
    simulation,
    scrollPosition: (key) => viewScroll()[key],
    rememberScroll: (key, offset) =>
      setViewScroll((current) => rememberViewScroll(current, key, offset)),
    setView,
    setFilter: (patch) => setFilterSignal((current) => ({ ...current, ...patch })),
    setSelectedModel: (modelId) => setSelectedId(modelId),
    clearSelectedModel: () => setSelectedId(null),
    setSelectedCategory,
    setTask: (task) => setSimulation((current) => ({ ...current, task })),
    runSimulation,
    dismissResult: () => setSimulation((current) => ({ ...current, result: null, request: null })),
    setSection: (section) => setSimulation((current) => ({ ...current, section })),
    back,
    close: () => context.ui.dialog.clear(),
  };
}
