/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ModelConfig } from './config.js';
import type { ModelCandidate } from './types.js';
export function modelToCandidate({ model }: ModelToCandidateArgs): ModelCandidate {
  const candidate: ModelCandidate = {
    id: model.id,
    provider: model.provider,
    capabilities: model.capabilities,
    priority: model.priority,
  };
  if (model.estimatedCostPer1kTokens !== undefined) {
    candidate.estimatedCost = model.estimatedCostPer1kTokens;
  }
  if (model.estimatedLatencyMs !== undefined) {
    candidate.estimatedLatencyMs = model.estimatedLatencyMs;
  }
  if (model.metadata !== undefined) {
    candidate.metadata = model.metadata;
  }
  return candidate;
}
type ModelToCandidateArgs = {
  model: ModelConfig;
};
