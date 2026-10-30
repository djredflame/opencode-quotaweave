/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type {
  ConfigRouteRequest,
  CostPolicyConfig,
  ModelConfig,
  SimulationRequest,
} from './config.js';
export function checkCostPolicy({ model, request, costPolicy }: CheckCostPolicyArgs): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  // Free-only mode
  if (costPolicy.freeOnly) {
    if (model.costClassification !== 'free') {
      reasons.push('Model is paid but free-only mode is enabled');
    }
  }
  // Max cost per request
  if (costPolicy.maxCostPerRequest !== undefined && model.estimatedCostPer1kTokens !== undefined) {
    if (model.estimatedCostPer1kTokens > costPolicy.maxCostPerRequest) {
      reasons.push(
        `Model estimated cost ${model.estimatedCostPer1kTokens} exceeds policy max ${costPolicy.maxCostPerRequest}`,
      );
    }
  }
  // Request-level max cost
  if (request.maxCost !== undefined && model.estimatedCostPer1kTokens !== undefined) {
    if (model.estimatedCostPer1kTokens > request.maxCost) {
      reasons.push(
        `Model estimated cost ${model.estimatedCostPer1kTokens} exceeds request max ${request.maxCost}`,
      );
    }
  }
  return { allowed: reasons.length === 0, reasons };
}
type CheckCostPolicyArgs = {
  model: ModelConfig;
  request: ConfigRouteRequest | SimulationRequest;
  costPolicy: CostPolicyConfig;
};
