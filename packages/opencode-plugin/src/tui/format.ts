/**
 * Formatting helpers for QuotaWeave views.
 */

import type { ModelConfig, SimulationCandidate } from '@opencode-quotaweave/core';
import type { Context } from '@opencode/plugin/tui/plugin';
import type { RGBA } from '@opentui/core';

type TuiTheme = Context['theme'];
type CostClassification = ModelConfig['costClassification'];

/** Human-readable cost classification. */
export function costLabel(classification: CostClassification): string {
  switch (classification) {
    case 'free':
      return 'Free';
    case 'paid':
      return 'Paid';
    default:
      return 'Unknown';
  }
}

/** Semantic color for a cost classification. */
export function costColor(theme: TuiTheme, classification: CostClassification): RGBA {
  switch (classification) {
    case 'free':
      return theme.text.feedback.success.base;
    case 'paid':
      return theme.text.feedback.warning.base;
    default:
      return theme.text.feedback.error.base;
  }
}

/** Semantic color for enabled state. */
export function enabledColor(theme: TuiTheme, enabled: boolean): RGBA {
  return enabled ? theme.text.feedback.success.base : theme.text.feedback.error.base;
}

/** Semantic color for a routing decision. */
export function decisionColor(theme: TuiTheme, permitted: boolean): RGBA {
  return permitted ? theme.text.feedback.success.base : theme.text.feedback.error.base;
}

/** Cost per 1k tokens or a fallback label. */
export function formatCostPer1k(value: number | undefined): string {
  return value === undefined ? 'N/A' : `$${value.toFixed(6)}`;
}

/** Latency in milliseconds or a fallback label. */
export function formatLatency(value: number | undefined): string {
  return value === undefined ? 'N/A' : `~${value}ms`;
}

/** Percentage with one decimal place. */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Score with three decimal places. */
export function formatScore(value: number): string {
  return value.toFixed(3);
}

/** Display name for a routing strategy. */
export function strategyLabel(strategy: string): string {
  return strategy
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Compact candidate summary for a single line. */
export function candidateSummary(candidate: SimulationCandidate): string {
  if (candidate.excluded) {
    return candidate.exclusionReasons.join('; ') || 'Excluded by policy';
  }
  return candidate.scoreBreakdown.totalScore.toFixed(3);
}

/** Compact duration for cooldowns. */
export function formatRemainingMs(value: number): string {
  if (value < 1000) return `${value}ms`;
  return `${Math.round(value / 1000)}s`;
}

const WEIGHT_LABELS: Readonly<Record<string, string>> = {
  'capability-match': 'cap',
  'cost-optimize': 'cost',
  'latency-optimize': 'latency',
  'quota-aware': 'quota',
  'priority-based': 'priority',
  'round-robin': 'round',
  weighted: 'weight',
  custom: 'custom',
};

/** Compact strategy-weight summary. */
export function formatWeights(weights: Readonly<Record<string, number>>): string {
  return Object.entries(weights)
    .map(([name, value]) => `${WEIGHT_LABELS[name] ?? name} ${Number(value).toFixed(2)}`)
    .join(' · ');
}
