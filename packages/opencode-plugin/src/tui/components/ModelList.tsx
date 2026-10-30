/**
 * Scrollable, mouse- and keyboard-navigable model list.
 */

import type { ModelConfig, ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { ScrollBoxRenderable } from '@opentui/core';
import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type Component,
} from 'solid-js';
import { Badge } from '../dialog/Primitives.js';
import { costColor, costLabel, enabledColor } from '../format.js';
import { CATEGORY_SHORT_LABELS } from '../state.js';
import { useModelListKeymap } from './useModelListKeymap.js';

interface ModelListProps {
  readonly config: ResolvedRoutingConfig;
  readonly models: readonly ModelConfig[];
  readonly selectedId: string | null;
  readonly initialScrollTop: number;
  readonly onSelect: (modelId: string) => void;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

interface ModelRowProps {
  readonly config: ResolvedRoutingConfig;
  readonly model: ModelConfig;
  readonly index: number;
  readonly active: boolean;
  readonly onSelect: (modelId: string) => void;
}

function rowId(index: number): string {
  return `quotaweave-model-row-${index}`;
}

function categoryText(model: ModelConfig, config: ResolvedRoutingConfig): string {
  const names = config.categories
    .filter((category) => category.enabled && category.modelIds.includes(model.id))
    .map((category) => CATEGORY_SHORT_LABELS[category.id] ?? category.id);
  return names.length > 0 ? names.join(', ') : 'no category';
}

const ModelRowStatus: Component<{ readonly model: ModelConfig }> = (props) => {
  const context = usePlugin();
  return (
    <box flexDirection="row" gap={1} alignItems="center" flexShrink={0}>
      <Badge
        label={costLabel(props.model.costClassification)}
        color={costColor(context.theme, props.model.costClassification)}
      />
      <text fg={enabledColor(context.theme, props.model.enabled)}>
        {props.model.enabled ? 'Enabled' : 'Disabled'}
      </text>
    </box>
  );
};

const ModelRowMetadata: Component<{
  readonly config: ResolvedRoutingConfig;
  readonly model: ModelConfig;
}> = (props) => {
  const context = usePlugin();
  return (
    <text
      fg={context.theme.text.faint}
      width="100%"
      truncate={true}
      overflow="hidden"
      wrapMode="none"
    >
      {props.model.provider} · {categoryText(props.model, props.config)} · priority{' '}
      {props.model.priority}
    </text>
  );
};

const ModelRow: Component<ModelRowProps> = (props) => {
  const context = usePlugin();
  const select = () => props.onSelect(props.model.id);

  return (
    <box
      id={rowId(props.index)}
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={0}
      backgroundColor={
        props.active
          ? context.theme.background.action.primary.selected
          : context.theme.background.raised.base
      }
      onMouseDown={select}
      onMouseUp={select}
    >
      <box flexDirection="row" gap={1} alignItems="center" minWidth={0}>
        <text fg={context.theme.text.action.primary.focused} flexShrink={0}>
          {props.active ? '▸' : ' '}
        </text>
        <box flexGrow={1} flexShrink={1} flexBasis={0} minWidth={0} overflow="hidden">
          <text
            fg={props.active ? context.theme.text.action.primary.focused : context.theme.text.base}
            attributes={props.active ? 1 : 0}
            width="100%"
            truncate={true}
            overflow="hidden"
            wrapMode="none"
          >
            {props.model.id}
          </text>
        </box>
        <ModelRowStatus model={props.model} />
      </box>
      <ModelRowMetadata config={props.config} model={props.model} />
    </box>
  );
};

interface ModelScrollerProps {
  readonly config: ResolvedRoutingConfig;
  readonly models: readonly ModelConfig[];
  readonly selectedId: string | null;
  readonly focusTarget: Accessor<ScrollBoxRenderable | undefined>;
  readonly setTarget: (value: ScrollBoxRenderable | undefined) => void;
  readonly onSelect: (modelId: string) => void;
}

const ModelScroller: Component<ModelScrollerProps> = (props) => {
  const context = usePlugin();
  return (
    <scrollbox
      ref={(value) => props.setTarget(value ?? undefined)}
      focusable={true}
      width="100%"
      flexGrow={1}
      flexBasis={0}
      minHeight={0}
      overflow="hidden"
      onMouseDown={() => props.focusTarget()?.focus()}
      scrollY={true}
      scrollX={false}
      verticalScrollbarOptions={{
        visible: true,
        trackOptions: {
          backgroundColor: context.theme.background.raised.base,
          foregroundColor: context.theme.scrollbar.base,
        },
      }}
      horizontalScrollbarOptions={{ visible: false }}
      contentOptions={{ padding: 0, gap: 0 }}
    >
      <For each={props.models}>
        {(model, index) => (
          <ModelRow
            config={props.config}
            model={model}
            index={index()}
            active={model.id === props.selectedId}
            onSelect={(id) => {
              props.focusTarget()?.focus();
              props.onSelect(id);
            }}
          />
        )}
      </For>
    </scrollbox>
  );
};

const EmptyModels: Component = () => {
  const context = usePlugin();
  return (
    <box padding={1} flexDirection="column" gap={1}>
      <text fg={context.theme.text.feedback.warning.base} attributes={1}>
        No models match these filters
      </text>
      <text fg={context.theme.text.muted}>Adjust the search, status, or category filter.</text>
    </box>
  );
};

function restoreScroll(
  target: Accessor<ScrollBoxRenderable | undefined>,
  initialScrollTop: number,
): void {
  onMount(() => {
    if (initialScrollTop <= 0) return;
    setTimeout(() => {
      const element = target();
      if (element && !element.isDestroyed) element.scrollTop = initialScrollTop;
    }, 1);
  });
}

function useModelListSelection(props: ModelListProps): {
  target: Accessor<ScrollBoxRenderable | undefined>;
  setTarget: (value: ScrollBoxRenderable | undefined) => void;
  cursor: Accessor<number>;
  selectAt: (index: number) => void;
} {
  const [target, setTarget] = createSignal<ScrollBoxRenderable | undefined>();
  const [cursor, setCursor] = createSignal(0);

  const selectedIndex = () => {
    const index = props.models.findIndex((model) => model.id === props.selectedId);
    return index < 0 ? 0 : index;
  };

  createEffect(() => {
    const index = selectedIndex();
    setCursor(index);
  });

  restoreScroll(target, props.initialScrollTop);

  onCleanup(() => {
    const element = target();
    if (!element || element.isDestroyed) return;
    props.onScrollPositionChange(element.scrollTop);
  });

  const selectAt = (index: number) => {
    const bounded = Math.max(0, Math.min(index, props.models.length - 1));
    const model = props.models[bounded];
    if (!model) return;
    setCursor(bounded);
    props.onSelect(model.id);
    setTimeout(() => {
      const element = target();
      if (element && !element.isDestroyed) element.scrollChildIntoView(rowId(bounded));
    }, 0);
  };

  return { target, setTarget, cursor, selectAt };
}

export const ModelList: Component<ModelListProps> = (props) => {
  const { target, cursor, selectAt, setTarget } = useModelListSelection(props);

  useModelListKeymap({
    target,
    cursor,
    models: () => props.models,
    selectAt,
  });

  return (
    <Show when={props.models.length > 0} fallback={<EmptyModels />}>
      <ModelScroller
        config={props.config}
        models={props.models}
        selectedId={props.selectedId}
        focusTarget={target}
        setTarget={setTarget}
        onSelect={props.onSelect}
      />
    </Show>
  );
};
