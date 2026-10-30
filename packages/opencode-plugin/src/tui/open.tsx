/**
 * Native OpenCode dialog binding for QuotaWeave.
 */

import { QuotaWeaveDialog } from './dialog/QuotaWeaveDialog.js';
import type { DialogHost, OpenQuotaWeaveOptions, QuotaWeaveSession } from './types.js';

/** The dialog size used by every QuotaWeave route. */
export const QUOTAWEAVE_DIALOG_SIZE = 'xlarge' as const;

/**
 * Open the shared dashboard in a host-managed dialog.
 *
 * The host owns dismissal, backdrop clicks, focus restoration, and the modal
 * key scope. QuotaWeave only supplies the dialog contents.
 */
export function openQuotaWeave(
  host: DialogHost,
  session: QuotaWeaveSession,
  options: OpenQuotaWeaveOptions,
): void {
  host.ui.dialog.show(() => (
    <QuotaWeaveDialog
      session={session}
      initialView={options.initialView}
      initialTask={options.initialTask}
    />
  ));
  host.ui.dialog.set({ size: QUOTAWEAVE_DIALOG_SIZE, centered: true });
}

/** Close QuotaWeave through the host dialog API. */
export function closeQuotaWeave(host: DialogHost): void {
  host.ui.dialog.clear();
}
