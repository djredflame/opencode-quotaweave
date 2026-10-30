/**
 * Host keymap bindings for the routing category list.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { KeymapCommand } from '@opencode/plugin/tui/context';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { Accessor } from 'solid-js';
import type { CategoryPool } from '../../routing-data.js';

interface RoutingListKeymapOptions {
  readonly target: Accessor<ScrollBoxRenderable | undefined>;
  readonly cursor: Accessor<number>;
  readonly pools: Accessor<readonly CategoryPool[]>;
  readonly selectAt: (index: number) => void;
}

function commands(options: RoutingListKeymapOptions): KeymapCommand[] {
  return [
    {
      id: 'quotaweave.tui.routing.previous',
      title: 'QuotaWeave: Previous category',
      bind: 'up',
      run: () => options.selectAt(options.cursor() - 1),
    },
    {
      id: 'quotaweave.tui.routing.next',
      title: 'QuotaWeave: Next category',
      bind: 'down',
      run: () => options.selectAt(options.cursor() + 1),
    },
    {
      id: 'quotaweave.tui.routing.page_up',
      title: 'QuotaWeave: Previous category page',
      bind: 'pageup',
      run: () => options.selectAt(options.cursor() - 10),
    },
    {
      id: 'quotaweave.tui.routing.page_down',
      title: 'QuotaWeave: Next category page',
      bind: 'pagedown',
      run: () => options.selectAt(options.cursor() + 10),
    },
    {
      id: 'quotaweave.tui.routing.first',
      title: 'QuotaWeave: First category',
      bind: 'home',
      run: () => options.selectAt(0),
    },
    {
      id: 'quotaweave.tui.routing.last',
      title: 'QuotaWeave: Last category',
      bind: 'end',
      run: () => options.selectAt(options.pools().length - 1),
    },
    {
      id: 'quotaweave.tui.routing.inspect',
      title: 'QuotaWeave: Inspect category',
      bind: 'return',
      run: () => options.selectAt(options.cursor()),
    },
  ];
}

/** Bind category navigation while the list owns focus. */
export function useRoutingListKeymap(options: RoutingListKeymapOptions): void {
  const context = usePlugin();
  context.keymap.layer(() => ({
    mode: 'modal',
    target: options.target,
    enabled: () => options.target() !== undefined && options.pools().length > 0,
    priority: 1,
    commands: commands(options),
  }));
}
