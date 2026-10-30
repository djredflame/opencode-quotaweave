/**
 * Slash, palette, and command-layer registration for the QuotaWeave TUI.
 */

import type { KeymapCommand } from '@opencode/plugin/tui/context';
import { openQuotaWeave } from './open.js';
import type {
  CommandHost,
  DialogHost,
  OpenQuotaWeaveOptions,
  QuotaWeaveSession,
  QuotaWeaveView,
} from './types.js';

/** Function that opens the shared dialog. Injected in tests. */
export type OpenDashboard = (
  host: DialogHost,
  session: QuotaWeaveSession,
  options: OpenQuotaWeaveOptions,
) => void;

/** Inputs for command construction. */
export interface CommandOptions {
  readonly host: CommandHost;
  readonly getSession: () => QuotaWeaveSession | null;
  readonly open?: OpenDashboard;
}

function openChecked(options: CommandOptions, view: QuotaWeaveView, task?: string): void {
  const session = options.getSession();
  if (!session) {
    options.host.ui.toast.show({
      message: 'QuotaWeave: no routing configuration loaded',
      variant: 'warning',
    });
    return;
  }
  const open = options.open ?? openQuotaWeave;
  open(options.host, session, {
    initialView: view,
    ...(task === undefined ? {} : { initialTask: task }),
  });
}

function routeCommand(options: CommandOptions): KeymapCommand {
  return {
    id: 'quotaweave.route',
    title: 'QuotaWeave: Open Overview',
    group: 'QuotaWeave',
    palette: true,
    slash: { name: 'route' },
    run: () => openChecked(options, 'overview'),
  };
}

function statusCommand(options: CommandOptions): KeymapCommand {
  return {
    id: 'quotaweave.route.status',
    title: 'QuotaWeave: Show Status',
    group: 'QuotaWeave',
    palette: true,
    slash: { name: 'route-status' },
    run: () => openChecked(options, 'overview'),
  };
}

function modelsCommand(options: CommandOptions): KeymapCommand {
  return {
    id: 'quotaweave.route.models',
    title: 'QuotaWeave: Open Model Explorer',
    group: 'QuotaWeave',
    palette: true,
    slash: { name: 'route-models' },
    run: () => openChecked(options, 'models'),
  };
}

function simulateCommand(options: CommandOptions): KeymapCommand {
  return {
    id: 'quotaweave.route.simulate',
    title: 'QuotaWeave: Open Routing Inspector',
    group: 'QuotaWeave',
    palette: true,
    slash: { name: 'route-simulate', arguments: true },
    run: (input?: string) => {
      const task = input?.trim();
      openChecked(options, 'simulate', task ? task : undefined);
    },
  };
}

/** Build the four public QuotaWeave commands. */
export function createCommands(options: CommandOptions): KeymapCommand[] {
  return [
    routeCommand(options),
    statusCommand(options),
    modelsCommand(options),
    simulateCommand(options),
  ];
}

/** Register the commands in a global keymap layer. */
export function registerCommandLayer(host: CommandHost, commands: readonly KeymapCommand[]): void {
  host.keymap.layer(() => ({
    mode: 'global',
    priority: 10,
    commands,
  }));
}
