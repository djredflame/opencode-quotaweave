/**
 * Pure state and data helpers for the QuotaWeave UI.
 *
 * Keeping this logic outside the components makes navigation and filtering
 * behavior testable without an OpenCode TUI runtime.
 */

import {
  PREDEFINED_CATEGORIES,
  type ModelConfig,
  type ResolvedRoutingConfig,
  type RoutingCategoryConfig,
  type SimulationRequest,
} from '@opencode-quotaweave/core';
import type {
  ModelFilterState,
  ModelStatusFilter,
  ProviderSummary,
  QuotaWeaveView,
  SimulationSection,
} from './types.js';

type CategoryId = RoutingCategoryConfig['id'];

/** Default model filters. */
export const DEFAULT_MODEL_FILTER: ModelFilterState = {
  searchQuery: '',
  statusFilter: 'all',
  categoryFilter: 'all',
};

/** Result inspector tabs, in display order. */
export const SIMULATION_SECTIONS: readonly { id: SimulationSection; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'decision', label: 'Decision' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'excluded', label: 'Excluded' },
  { id: 'details', label: 'Details' },
];

/** Short category labels for compact controls and grids. */
export const CATEGORY_SHORT_LABELS: Readonly<Record<string, string>> = {
  general: 'General',
  coding: 'Coding',
  reasoning: 'Reasoning',
  planning: 'Planning',
  debugging: 'Debugging',
  review: 'Review',
  testing: 'Testing',
  quick: 'Quick',
  documentation: 'Docs',
  vision: 'Vision',
};

/** Type guard for result sections. */
export function isSimulationSection(value: string): value is SimulationSection {
  return SIMULATION_SECTIONS.some((section) => section.id === value);
}

/** Type guard for status filters. */
export function isStatusFilter(value: string): value is ModelStatusFilter {
  return value === 'all' || value === 'enabled' || value === 'disabled';
}

/** Type guard for category filters. */
export function isCategoryFilter(
  value: string,
  _config: ResolvedRoutingConfig,
): value is 'all' | CategoryId {
  return value === 'all' || Object.prototype.hasOwnProperty.call(PREDEFINED_CATEGORIES, value);
}

function matchesQuery(model: ModelConfig, query: string): boolean {
  if (!query) return true;
  const haystack = [model.id, model.provider, model.displayName ?? '', ...model.capabilities]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function matchesCategory(
  model: ModelConfig,
  categoryId: 'all' | CategoryId,
  config: ResolvedRoutingConfig,
): boolean {
  if (categoryId === 'all') return true;
  // If category is not configured, it has no models, so no match
  const category = config.categories.find((c) => c.id === categoryId);
  if (!category) return false;
  return category.enabled && category.modelIds.includes(model.id);
}

/** Apply search, status, and category filters in that order. */
export function filterModels(
  config: ResolvedRoutingConfig,
  filter: ModelFilterState,
): ModelConfig[] {
  const query = filter.searchQuery.trim().toLowerCase();
  return config.models.filter((model) => {
    if (!matchesQuery(model, query)) return false;
    if (filter.statusFilter === 'enabled' && !model.enabled) return false;
    if (filter.statusFilter === 'disabled' && model.enabled) return false;
    return matchesCategory(model, filter.categoryFilter, config);
  });
}

/** Build a local simulation request. The engine infers the category. */
export function buildSimulationRequest(task: string): SimulationRequest {
  return { task: task.trim() };
}

/** A task is runnable when it contains non-whitespace content. */
export function isRunnableTask(task: string): boolean {
  return task.trim().length > 0;
}

/** Where the dashboard-level Back action goes. */
export function backTarget(view: QuotaWeaveView): 'overview' | 'close' {
  return view === 'overview' ? 'close' : 'overview';
}

/** Aggregate provider information without duplicating model data. */
export function collectProviders(models: readonly ModelConfig[]): ProviderSummary[] {
  const providers = new Map<string, { modelCount: number; enabledCount: number }>();
  for (const model of models) {
    const current = providers.get(model.provider) ?? { modelCount: 0, enabledCount: 0 };
    providers.set(model.provider, {
      modelCount: current.modelCount + 1,
      enabledCount: current.enabledCount + (model.enabled ? 1 : 0),
    });
  }
  return [...providers.entries()]
    .map(([name, counts]) => ({ name, ...counts }))
    .sort(
      (left, right) => right.modelCount - left.modelCount || left.name.localeCompare(right.name),
    );
}

/** Categories assigned to a model, split by enabled state. */
export function categoriesForModel(
  config: ResolvedRoutingConfig,
  modelId: string,
): { enabled: RoutingCategoryConfig[]; disabled: RoutingCategoryConfig[] } {
  const assigned = config.categories.filter((category) => category.modelIds.includes(modelId));
  return {
    enabled: assigned.filter((category) => category.enabled),
    disabled: assigned.filter((category) => !category.enabled),
  };
}

/** Look up a configured model by ID. */
export function findModel(
  config: ResolvedRoutingConfig,
  modelId: string | null,
): ModelConfig | null {
  if (modelId === null) return null;
  return config.models.find((model) => model.id === modelId) ?? null;
}

/** Find the first category that explicitly contains a model. */
export function primaryCategoryName(config: ResolvedRoutingConfig, modelId: string): string | null {
  const category = config.categories.find(
    (item) => item.enabled && item.modelIds.includes(modelId),
  );
  return category?.name ?? null;
}

/** Move through the result inspector sections with wraparound. */
export function cycleSimulationSection(
  current: SimulationSection,
  direction: 1 | -1,
): SimulationSection {
  const index = SIMULATION_SECTIONS.findIndex((section) => section.id === current);
  const next = (index + direction + SIMULATION_SECTIONS.length) % SIMULATION_SECTIONS.length;
  return SIMULATION_SECTIONS[next]?.id ?? 'summary';
}

/** Host dialog width preset for the available terminal width. */
export function resolveDialogSize(width: number): 'medium' | 'large' | 'xlarge' {
  if (width >= 140) return 'xlarge';
  if (width >= 100) return 'large';
  return 'medium';
}

/** Responsive classes for the fixed application shell. */
export type LayoutMode = 'compact' | 'standard' | 'desktop' | 'wide';

/** Rows reserved for host dialog chrome around the shell. */
const HOST_CHROME_ROWS = 6;

/** Smallest shell height that still keeps the content area usable. */
const MIN_SHELL_HEIGHT = 8;

/** Widest centered content column on ultrawide terminals. */
const MAX_CONTENT_WIDTH = 132;

/** Classify the current terminal width for desktop-first layout choices. */
export function resolveLayoutMode(width: number): LayoutMode {
  if (width >= 180) return 'wide';
  if (width >= 140) return 'desktop';
  if (width >= 100) return 'standard';
  return 'compact';
}

/** Navigation density for the fixed tab bar. */
export type NavigationDensity = 'compact' | 'comfortable';

/** Compact navigation removes tab padding so six labels stay on one line. */
export function resolveNavigationDensity(width: number): NavigationDensity {
  return resolveLayoutMode(width) === 'compact' ? 'compact' : 'comfortable';
}

/** True when side-by-side overview columns remain readable. */
export function hasWideLayout(width: number): boolean {
  const mode = resolveLayoutMode(width);
  return mode === 'desktop' || mode === 'wide';
}

/** True when the model list and inspector can share a row. */
export function hasSplitLayout(width: number): boolean {
  return resolveLayoutMode(width) !== 'compact';
}

/** Maximum centered content width, bounded on ultrawide terminals. */
export function resolveContentMaxWidth(width: number): number {
  if (resolveLayoutMode(width) !== 'wide') return width;
  return Math.min(MAX_CONTENT_WIDTH, Math.max(0, width - 8));
}

/** Shell height that uses the host viewport without exceeding it. */
export function resolveShellHeight(terminalHeight: number): number {
  const available = Math.max(MIN_SHELL_HEIGHT, terminalHeight - HOST_CHROME_ROWS);
  return Math.min(Math.max(0, terminalHeight), available);
}
