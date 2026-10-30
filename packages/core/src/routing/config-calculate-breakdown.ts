/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type {
  ConfigRouteRequest,
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  SimulationRequest,
} from './config.js';
import type { ScoreBreakdown } from './types.js';
export function calculateBreakdown({
  resolvedConfig,
  model,
  request,
  category,
}: CalculateBreakdownArgs): ScoreBreakdown {
  // Capability match score (0-1)
  let capabilityMatch = 1.0;
  if (request.requiredCapabilities && request.requiredCapabilities.length > 0) {
    const matched = request.requiredCapabilities.filter((cap) =>
      model.capabilities.includes(cap),
    ).length;
    capabilityMatch = matched / request.requiredCapabilities.length;
  } else if (category.modelIds.includes(model.id)) {
    // Base capability match for category membership
    capabilityMatch = 0.8;
  }
  // Cost score (0-1, lower cost = higher score)
  let costScore = 0.5;
  if (model.estimatedCostPer1kTokens !== undefined) {
    const maxCost = request.maxCost ?? resolvedConfig.costPolicy.maxCostPerRequest ?? 1.0;
    costScore = Math.max(0, 1 - model.estimatedCostPer1kTokens / maxCost);
  } else if (model.costClassification === 'free') {
    costScore = 1.0;
  } else if (model.costClassification === 'unknown') {
    costScore = 0.3;
  }
  // Latency score (0-1, lower latency = higher score)
  let latencyScore = 0.5;
  if (model.estimatedLatencyMs !== undefined) {
    const maxLatency = request.maxLatencyMs ?? 5000;
    latencyScore = Math.max(0, 1 - model.estimatedLatencyMs / maxLatency);
  }
  // Quota score (placeholder - would need quota data)
  const quotaScore = 0.5;
  // Priority score (0-1, higher priority = higher score)
  const priorityScore = Math.min(model.priority / 100, 1);
  return {
    capabilityMatch,
    costScore,
    latencyScore,
    quotaScore,
    priorityScore,
    customScores: {},
  };
}
type CalculateBreakdownArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  model: ModelConfig;
  request: ConfigRouteRequest | SimulationRequest;
  category: RoutingCategoryConfig;
};
