/**
 * QuotaWeave Model Explorer.
 *
 * Wide terminals use a list/detail split; narrow terminals show one pane at a
 * time so controls never clip. Pane switches are reactive, so selecting a model
 * updates the inspector without remounting the view or switching tabs.
 */

import type { ModelConfig, ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { useTerminalDimensions } from '@opentui/solid';
import { Show, createEffect, createMemo, type Accessor, type Component } from 'solid-js';
import { ModelDetailView } from '../components/ModelDetailView.js';
import { ModelFilters } from '../components/ModelFilters.js';
import { ModelList } from '../components/ModelList.js';
import { filterModels, hasSplitLayout } from '../state.js';
import type { ModelFilterState } from '../types.js';

interface ModelScrollProps {
  readonly listScrollTop: number;
  readonly detailScrollTop: number;
  readonly onListScrollChange: (scrollTop: number) => void;
  readonly onDetailScrollChange: (scrollTop: number) => void;
}

interface ModelExplorerViewProps extends ModelScrollProps {
  readonly config: ResolvedRoutingConfig;
  readonly filter: Accessor<ModelFilterState>;
  readonly selectedModel: Accessor<ModelConfig | null>;
  readonly onFilterChange: (patch: Partial<ModelFilterState>) => void;
  readonly onSelectModel: (modelId: string) => void;
  readonly onClearModel: () => void;
}

interface ExplorerPanesProps extends ModelScrollProps {
  readonly config: ResolvedRoutingConfig;
  readonly models: readonly ModelConfig[];
  readonly selectedModel: Accessor<ModelConfig | null>;
  readonly wide: boolean;
  readonly onSelectModel: (modelId: string) => void;
  readonly onClearModel: () => void;
}

interface ListPaneProps {
  readonly config: ResolvedRoutingConfig;
  readonly models: readonly ModelConfig[];
  readonly selectedId: string | null;
  readonly initialScrollTop: number;
  readonly onSelectModel: (modelId: string) => void;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

interface DetailPaneProps {
  readonly config: ResolvedRoutingConfig;
  readonly selectedModel: Accessor<ModelConfig | null>;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
  readonly onClearModel: () => void;
}

const ListPane: Component<ListPaneProps> = (props) => {
  return (
    <box flexDirection="column" flexGrow={1} minHeight={0} minWidth={0} overflow="hidden">
      <ModelList
        config={props.config}
        models={props.models}
        selectedId={props.selectedId}
        initialScrollTop={props.initialScrollTop}
        onSelect={props.onSelectModel}
        onScrollPositionChange={props.onScrollPositionChange}
      />
    </box>
  );
};

const EmptyDetail: Component = () => {
  const context = usePlugin();
  return (
    <box padding={1} minHeight={0} overflow="hidden">
      <text fg={context.theme.text.muted} wrapMode="word">
        Select a model to inspect its capabilities, categories, costs, and fallbacks.
      </text>
    </box>
  );
};

const DetailPane: Component<DetailPaneProps> = (props) => {
  const model = createMemo(() => props.selectedModel());
  return (
    <Show when={model()} fallback={<EmptyDetail />} keyed>
      {(m: ModelConfig) => (
        <ModelDetailView
          config={props.config}
          model={m}
          initialScrollTop={props.initialScrollTop}
          onScrollPositionChange={props.onScrollPositionChange}
          onBack={props.onClearModel}
        />
      )}
    </Show>
  );
};

const CompactPanes: Component<ExplorerPanesProps> = (props) => {
  return (
    <Show
      when={props.selectedModel}
      fallback={
        <ListPane
          config={props.config}
          models={props.models}
          selectedId={null}
          initialScrollTop={props.listScrollTop}
          onSelectModel={props.onSelectModel}
          onScrollPositionChange={props.onListScrollChange}
        />
      }
    >
      <DetailPane
        config={props.config}
        selectedModel={props.selectedModel}
        initialScrollTop={props.detailScrollTop}
        onScrollPositionChange={props.onDetailScrollChange}
        onClearModel={props.onClearModel}
      />
    </Show>
  );
};

const WidePanes: Component<ExplorerPanesProps> = (props) => {
  return (
    <box flexDirection="row" gap={2} flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
      <box flexGrow={2} flexBasis={0} minWidth={0} minHeight={0} overflow="hidden">
        <ListPane
          config={props.config}
          models={props.models}
          selectedId={props.selectedModel()?.id ?? null}
          initialScrollTop={props.listScrollTop}
          onSelectModel={props.onSelectModel}
          onScrollPositionChange={props.onListScrollChange}
        />
      </box>
      <box flexGrow={3} flexBasis={0} minWidth={0} minHeight={0} overflow="hidden">
        <DetailPane
          config={props.config}
          selectedModel={props.selectedModel}
          initialScrollTop={props.detailScrollTop}
          onScrollPositionChange={props.onDetailScrollChange}
          onClearModel={props.onClearModel}
        />
      </box>
    </box>
  );
};

const ExplorerPanes: Component<ExplorerPanesProps> = (props) => {
  return (
    <Show when={props.wide} fallback={<CompactPanes {...props} />}>
      <WidePanes {...props} />
    </Show>
  );
};

export const ModelExplorerView: Component<ModelExplorerViewProps> = (props) => {
  const dimensions = useTerminalDimensions();
  const models = createMemo(() => filterModels(props.config, props.filter()));
  const wide = () => hasSplitLayout(dimensions().width);

  createEffect(() => {
    const selected = props.selectedModel();
    if (selected && !models().some((model) => model.id === selected.id)) {
      props.onClearModel();
    }
  });

  return (
    <box flexDirection="column" gap={1} flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
      <ModelFilters
        config={props.config}
        filter={props.filter}
        count={models().length}
        onFilterChange={props.onFilterChange}
      />
      <ExplorerPanes
        config={props.config}
        models={models()}
        selectedModel={props.selectedModel}
        wide={wide()}
        listScrollTop={props.listScrollTop}
        detailScrollTop={props.detailScrollTop}
        onSelectModel={props.onSelectModel}
        onClearModel={props.onClearModel}
        onListScrollChange={props.onListScrollChange}
        onDetailScrollChange={props.onDetailScrollChange}
      />
    </box>
  );
};
