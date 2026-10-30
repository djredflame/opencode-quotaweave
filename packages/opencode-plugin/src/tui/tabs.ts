/**
 * Main navigation destinations and their stable identifiers.
 *
 * This module is the single source of tab order, labels, descriptions and
 * placeholder metadata.
 */

import type { QuotaWeaveView } from './types.js';

/** One authoritative definition for a main navigation destination. */
export interface QuotaWeaveTab {
  readonly id: QuotaWeaveView;
  readonly label: string;
  readonly description: string;
  readonly placeholder: boolean;
}

/** Top-level tabs, in display order. */
export const VIEW_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'High-level QuotaWeave status, configuration and integration limits.',
    placeholder: false,
  },
  {
    id: 'models',
    label: 'Models',
    description: 'Model explorer with filtering, selection and inspection.',
    placeholder: false,
  },
  {
    id: 'routing',
    label: 'Routing',
    description: 'Routing categories, model selection strategies and routing configuration.',
    placeholder: false,
  },
  {
    id: 'policies',
    label: 'Policies',
    description:
      'Cost constraints, free-only rules, cooldown configuration and shadow mode settings.',
    placeholder: false,
  },
  {
    id: 'simulate',
    label: 'Simulate',
    description: 'Simulation and explainability for routing decisions.',
    placeholder: false,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Agent Mesh configuration, plugin integration and runtime diagnostics.',
    placeholder: false,
  },
] as const satisfies readonly QuotaWeaveTab[];

/** Default tab used when a view cannot be resolved. */
export const DEFAULT_VIEW: QuotaWeaveView = 'overview';

/** Look up the authoritative definition for a view. */
export function viewTab(view: QuotaWeaveView): QuotaWeaveTab {
  return VIEW_TABS.find((tab) => tab.id === view) ?? VIEW_TABS[0];
}

/** Type guard for views. */
export function isQuotaWeaveView(value: string): value is QuotaWeaveView {
  return VIEW_TABS.some((tab) => tab.id === value);
}

/** Move through the main views with wraparound. */
export function nextView(current: QuotaWeaveView, direction: 1 | -1): QuotaWeaveView {
  return neighbourTab(VIEW_TABS, current, direction) ?? DEFAULT_VIEW;
}

/** Move through a tab list with wraparound and a valid-id boundary. */
export function neighbourTab<T extends { readonly id: string }>(
  tabs: readonly T[],
  current: string,
  direction: 1 | -1,
): T['id'] | null {
  if (tabs.length === 0) return null;
  const index = tabs.findIndex((tab) => tab.id === current);
  if (index < 0) {
    const fallback = direction === 1 ? tabs[0] : tabs[tabs.length - 1];
    return fallback?.id ?? null;
  }
  const next = (index + direction + tabs.length) % tabs.length;
  return tabs[next]?.id ?? null;
}
