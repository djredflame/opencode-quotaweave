/**
 * Host keymap bindings for a focused tab bar.
 *
 * The layer is active only while one of this bar's tabs owns focus. It uses
 * the host's modal mode, never binds Escape, and does not touch global session
 * tab shortcuts.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { KeymapCommand } from '@opencode/plugin/tui/context';
import type { Accessor } from 'solid-js';
import { neighbourTab } from '../tabs.js';

interface TabItem {
  readonly id: string;
  readonly label: string;
}

interface TabKeymapOptions {
  readonly scope: string;
  readonly tabs: readonly TabItem[];
  readonly active: string;
  readonly focusedId: Accessor<string | null>;
  readonly focusTab: (id: string) => void;
  readonly onChange: (id: string) => void;
}

function commands(options: TabKeymapOptions): KeymapCommand[] {
  const activate = () => {
    const id = options.focusedId();
    if (id !== null) options.onChange(id);
  };

  const moveFocus = (direction: 1 | -1) => {
    const base = options.focusedId() ?? options.active;
    const id = neighbourTab(options.tabs, base, direction);
    if (id !== null) options.focusTab(id);
  };

  return [
    {
      id: `quotaweave.tui.${options.scope}.activate`,
      title: 'QuotaWeave: Open tab',
      bind: 'return',
      run: activate,
    },
    {
      id: `quotaweave.tui.${options.scope}.activate.space`,
      title: 'QuotaWeave: Open tab',
      bind: 'space',
      run: activate,
    },
    {
      id: `quotaweave.tui.${options.scope}.focus.previous`,
      title: 'QuotaWeave: Previous tab',
      bind: 'left',
      run: () => moveFocus(-1),
    },
    {
      id: `quotaweave.tui.${options.scope}.focus.next`,
      title: 'QuotaWeave: Next tab',
      bind: 'right',
      run: () => moveFocus(1),
    },
  ];
}

export function useTabKeymap(options: TabKeymapOptions): void {
  const context = usePlugin();
  context.keymap.layer(() => ({
    mode: 'modal',
    enabled: () => options.focusedId() !== null,
    priority: 1,
    commands: commands(options),
  }));
}
