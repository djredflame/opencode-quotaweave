/**
 * Host keymap bindings for the model list.
 */

import type { ModelConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { KeymapCommand } from '@opencode/plugin/tui/context';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { Accessor } from 'solid-js';

interface ModelListKeymapOptions {
  readonly target: Accessor<ScrollBoxRenderable | undefined>;
  readonly cursor: Accessor<number>;
  readonly models: Accessor<readonly ModelConfig[]>;
  readonly selectAt: (index: number) => void;
}

function commands(options: ModelListKeymapOptions): KeymapCommand[] {
  return [
    {
      id: 'quotaweave.tui.models.previous',
      title: 'QuotaWeave: Previous model',
      bind: 'up',
      run: () => options.selectAt(options.cursor() - 1),
    },
    {
      id: 'quotaweave.tui.models.next',
      title: 'QuotaWeave: Next model',
      bind: 'down',
      run: () => options.selectAt(options.cursor() + 1),
    },
    {
      id: 'quotaweave.tui.models.page_up',
      title: 'QuotaWeave: Previous model page',
      bind: 'pageup',
      run: () => options.selectAt(options.cursor() - 10),
    },
    {
      id: 'quotaweave.tui.models.page_down',
      title: 'QuotaWeave: Next model page',
      bind: 'pagedown',
      run: () => options.selectAt(options.cursor() + 10),
    },
    {
      id: 'quotaweave.tui.models.first',
      title: 'QuotaWeave: First model',
      bind: 'home',
      run: () => options.selectAt(0),
    },
    {
      id: 'quotaweave.tui.models.last',
      title: 'QuotaWeave: Last model',
      bind: 'end',
      run: () => options.selectAt(options.models().length - 1),
    },
    {
      id: 'quotaweave.tui.models.inspect',
      title: 'QuotaWeave: Inspect model',
      bind: 'return',
      run: () => options.selectAt(options.cursor()),
    },
  ];
}

/** Bind navigation keys while the list owns focus. */
export function useModelListKeymap(options: ModelListKeymapOptions): void {
  const context = usePlugin();
  context.keymap.layer(() => ({
    mode: 'modal',
    target: options.target,
    enabled: () => options.target() !== undefined && options.models().length > 0,
    priority: 1,
    commands: commands(options),
  }));
}
