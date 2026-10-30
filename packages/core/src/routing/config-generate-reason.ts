/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { type ScoredCandidate } from './config-engine-shared.js';
import type { RoutingCategoryConfig } from './config.js';
export function generateReason({ best, category }: GenerateReasonArgs): string {
  const { model, breakdown } = best;
  const reasons: string[] = [];
  if (breakdown.capabilityMatch > 0.8) {
    reasons.push('excellent capability match');
  } else if (breakdown.capabilityMatch > 0.5) {
    reasons.push('good capability match');
  }
  if (breakdown.costScore > 0.7) {
    reasons.push('cost-efficient');
  }
  if (breakdown.latencyScore > 0.7) {
    reasons.push('low latency');
  }
  if (breakdown.priorityScore > 0.7) {
    reasons.push('high priority');
  }
  if (reasons.length === 0) {
    reasons.push('best available option');
  }
  return `Selected ${model.id} (${model.provider}) for category '${category.id}': ${reasons.join(', ')}`;
}
type GenerateReasonArgs = {
  best: ScoredCandidate;
  category: RoutingCategoryConfig;
};
