/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ScoreBreakdown } from './types.js';
export function calculateTotalScore({ breakdown, weights }: CalculateTotalScoreArgs): number {
  return (
    breakdown.capabilityMatch * (weights.capabilityMatch ?? 0) +
    breakdown.costScore * (weights.costScore ?? 0) +
    breakdown.latencyScore * (weights.latencyScore ?? 0) +
    breakdown.quotaScore * (weights.quotaScore ?? 0) +
    breakdown.priorityScore * (weights.priorityScore ?? 0)
  );
}
type CalculateTotalScoreArgs = {
  breakdown: ScoreBreakdown;
  weights: Record<string, number>;
};
