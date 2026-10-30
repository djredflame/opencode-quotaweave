/**
 * Read-only routing category and model-pool explorer.
 */

import type { ResolvedRoutingConfig, RoutingCategoryId } from '@opencode-quotaweave/core';
import { useTerminalDimensions } from '@opentui/solid';
import { Show, createMemo, type Component } from 'solid-js';
import { RoutingCategoryInspector } from '../components/routing/RoutingCategoryInspector.js';
import { RoutingCategoryList } from '../components/routing/RoutingCategoryList.js';
import { RoutingSummaryBar } from '../components/routing/RoutingSummaryBar.js';
import { buildCategoryPools, summarizeRouting } from '../routing-data.js';
import { hasSplitLayout } from '../state.js';

interface RoutingViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly selectedCategory: RoutingCategoryId;
  readonly listScrollTop: number;
  readonly detailScrollTop: number;
  readonly onSelectCategory: (category: RoutingCategoryId) => void;
  readonly onListScrollChange: (scrollTop: number) => void;
  readonly onDetailScrollChange: (scrollTop: number) => void;
}

export const RoutingView: Component<RoutingViewProps> = (props) => {
  const dimensions = useTerminalDimensions();
  const pools = createMemo(() => buildCategoryPools(props.config));
  const selectedPool = () =>
    pools().find((pool) => pool.id === props.selectedCategory) ?? pools()[0];
  const summary = createMemo(() => summarizeRouting(props.config, pools()));

  return (
    <box flexDirection="column" flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden" gap={1}>
      <RoutingSummaryBar summary={summary()} />
      <Show when={selectedPool()}>
        {(pool) => (
          <box
            flexDirection={hasSplitLayout(dimensions().width) ? 'row' : 'column'}
            gap={2}
            flexGrow={1}
            flexBasis={0}
            minHeight={0}
            overflow="hidden"
          >
            <box flexGrow={2} flexBasis={0} minWidth={0} minHeight={0} overflow="hidden">
              <RoutingCategoryList
                pools={pools()}
                selectedId={props.selectedCategory}
                initialScrollTop={props.listScrollTop}
                onSelect={props.onSelectCategory}
                onScrollPositionChange={props.onListScrollChange}
              />
            </box>
            <box flexGrow={3} flexBasis={0} minWidth={0} minHeight={0} overflow="hidden">
              <RoutingCategoryInspector
                pool={pool()}
                initialScrollTop={props.detailScrollTop}
                onScrollPositionChange={props.onDetailScrollChange}
              />
            </box>
          </box>
        )}
      </Show>
    </box>
  );
};
