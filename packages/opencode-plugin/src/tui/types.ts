/**
 * Shared types for the QuotaWeave terminal interface.
 *
 * The UI is presented inside a host-managed OpenCode dialog. These types keep
 * the dialog binding narrow so it can be tested without a full TUI runtime.
 */

import type {
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  SimulationRequest,
  SimulationResult,
} from '@opencode-quotaweave/core';
import type { Context } from '@opencode/plugin/tui/plugin';

/** Plugin version displayed in the dialog header. */
export const QUOTAWEAVE_VERSION = '0.1.0';

/** Top-level QuotaWeave views. */
export type QuotaWeaveView = 'overview' | 'models' | 'routing' | 'policies' | 'simulate' | 'system';

/** Model status filter. */
export type ModelStatusFilter = 'all' | 'enabled' | 'disabled';

/** Model list filters. */
export interface ModelFilterState {
  readonly searchQuery: string;
  readonly statusFilter: ModelStatusFilter;
  readonly categoryFilter: 'all' | RoutingCategoryConfig['id'];
}

/** Result inspector sections. */
export type SimulationSection = 'summary' | 'decision' | 'candidates' | 'excluded' | 'details';

/** Simulation state that must survive inspecting results. */
export interface SimulationUiState {
  readonly task: string;
  readonly result: SimulationResult | null;
  readonly request: SimulationRequest | null;
  readonly section: SimulationSection;
}

/** Minimal routing engine surface used by the UI. */
export interface SimulationEngine {
  simulate(request: SimulationRequest): SimulationResult;
}

/** Loaded configuration and engine shared by every view. */
export interface QuotaWeaveSession {
  readonly config: ResolvedRoutingConfig;
  readonly engine: SimulationEngine;
}

/** The parts of the plugin context the dialog binding needs. */
export interface DialogHost {
  readonly ui: {
    readonly dialog: Pick<Context['ui']['dialog'], 'show' | 'set' | 'clear'>;
    readonly toast: Pick<Context['ui']['toast'], 'show'>;
  };
}

/** The parts of the plugin context command registration needs. */
export interface CommandHost extends DialogHost {
  readonly keymap: Pick<Context['keymap'], 'layer'>;
}

/** The parts of the plugin context setup needs. */
export interface QuotaWeaveHost extends CommandHost {
  readonly location?: { readonly directory?: string | undefined } | undefined;
}

/** Options for opening the shared QuotaWeave dialog. */
export interface OpenQuotaWeaveOptions {
  readonly initialView: QuotaWeaveView;
  readonly initialTask?: string | undefined;
}

/** Props for the root dialog component. */
export interface QuotaWeaveDialogProps {
  readonly session: QuotaWeaveSession;
  readonly initialView: QuotaWeaveView;
  readonly initialTask?: string | undefined;
}

/** Props shared by all dashboard views. */
export interface DashboardViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly onNavigate: (view: QuotaWeaveView) => void;
}

/** Selected model lookup result. */
export interface SelectedModel {
  readonly model: ModelConfig;
  readonly categories: readonly string[];
}

/** Provider summary used by the overview. */
export interface ProviderSummary {
  readonly name: string;
  readonly modelCount: number;
  readonly enabledCount: number;
}
