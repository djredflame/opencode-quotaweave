/**
 * Scrollable, mouse- and keyboard-navigable routing category list.
 */

import type { RoutingCategoryId } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { ScrollBoxRenderable } from '@opentui/core';
import { For, createEffect, createSignal, type Component } from 'solid-js';
import { enabledColor } from '../../format.js';
import type { CategoryPool } from '../../routing-data.js';
import { ScrollRegion } from '../ScrollRegion.js';
import { useRoutingListKeymap } from './useRoutingListKeymap.js';

interface RoutingCategoryListProps {
  readonly pools: readonly CategoryPool[];
  readonly selectedId: RoutingCategoryId;
  readonly initialScrollTop: number;
  readonly onSelect: (category: RoutingCategoryId) => void;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

interface CategoryRowProps {
  readonly pool: CategoryPool;
  readonly index: number;
  readonly active: boolean;
  readonly onSelect: (category: RoutingCategoryId) => void;
  readonly focusTarget: () => ScrollBoxRenderable | undefined;
}

function rowId(index: number): string {
  return `quotaweave-routing-row-${index}`;
}

function poolCounts(pool: CategoryPool): string {
  if (!pool.configured) return 'not configured';
  if (pool.configuredModelCount === 0) return 'empty pool';
  const unresolved =
    pool.unresolvedModelCount > 0 ? ` · ${pool.unresolvedModelCount} unresolved` : '';
  return `${pool.configuredModelCount} assigned · ${pool.enabledModelCount} enabled${unresolved}`;
}

function poolStatus(pool: CategoryPool): string {
  if (!pool.configured) return 'n/a';
  return pool.enabled ? 'Enabled' : 'Disabled';
}

function categoryRowContent(
  props: CategoryRowProps & { readonly context: ReturnType<typeof usePlugin> },
) {
  const statusColor = () =>
    props.pool.configured
      ? enabledColor(props.context.theme, props.pool.enabled)
      : props.context.theme.text.feedback.warning.base;

  return (
    <>
      <box flexDirection="row" gap={1} alignItems="center" minWidth={0}>
        <text fg={props.context.theme.text.action.primary.focused} flexShrink={0}>
          {props.active ? '▸' : ' '}
        </text>
        <box flexGrow={1} flexShrink={1} flexBasis={0} minWidth={0} overflow="hidden">
          <text
            fg={
              props.active
                ? props.context.theme.text.action.primary.focused
                : props.context.theme.text.base
            }
            attributes={props.active ? 1 : 0}
            width="100%"
            truncate={true}
            overflow="hidden"
            wrapMode="none"
          >
            {props.pool.name}
          </text>
        </box>
        <text fg={statusColor()} flexShrink={0}>
          {poolStatus(props.pool)}
        </text>
      </box>
      <text fg={props.context.theme.text.faint} overflow="hidden" wrapMode="none">
        {poolCounts(props.pool)}
      </text>
    </>
  );
}

const CategoryRow: Component<CategoryRowProps> = (props) => {
  const context = usePlugin();
  const select = () => {
    props.focusTarget()?.focus();
    props.onSelect(props.pool.id);
  };

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
      {categoryRowContent({ ...props, context })}
    </box>
  );
};

export const RoutingCategoryList: Component<RoutingCategoryListProps> = (props) => {
  const [target, setTarget] = createSignal<ScrollBoxRenderable>();
  const [cursor, setCursor] = createSignal(0);

  const selectedIndex = () => {
    const index = props.pools.findIndex((pool) => pool.id === props.selectedId);
    return index < 0 ? 0 : index;
  };

  createEffect(() => {
    setCursor(selectedIndex());
  });

  const selectAt = (index: number) => {
    const bounded = Math.max(0, Math.min(index, props.pools.length - 1));
    const pool = props.pools[bounded];
    if (!pool) return;
    setCursor(bounded);
    props.onSelect(pool.id);
    setTimeout(() => {
      const element = target();
      if (element && !element.isDestroyed) element.scrollChildIntoView(rowId(bounded));
    }, 0);
  };

  useRoutingListKeymap({
    target,
    cursor,
    pools: () => props.pools,
    selectAt,
  });

  return (
    <ScrollRegion
      autofocus={true}
      initialScrollTop={props.initialScrollTop}
      onScrollPositionChange={props.onScrollPositionChange}
      onReady={setTarget}
    >
      <For each={props.pools}>
        {(pool, index) => (
          <CategoryRow
            pool={pool}
            index={index()}
            active={pool.id === props.selectedId}
            onSelect={props.onSelect}
            focusTarget={target}
          />
        )}
      </For>
    </ScrollRegion>
  );
};
