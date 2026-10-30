/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ResolvedRoutingConfig, SimulationRequest, SimulationResult } from './config.js';
export function createSimulationRefusal({
  resolvedConfig,
  request,
  requestId,
  startTime,
  reason,
  heuristicCategory,
}: CreateSimulationRefusalArgs): SimulationResult {
  return {
    category: request.category ?? 'unknown',
    candidates: [],
    selectedModel: null,
    costPolicy: resolvedConfig.costPolicy,
    activeCooldowns: [],
    permitted: false,
    rejectionReason: reason,
    metadata: {
      timestamp: Date.now(),
      requestId,
      strategy: resolvedConfig.defaultStrategy,
      decisionTimeMs: Date.now() - startTime,
      heuristicCategory,
    },
  };
}
type CreateSimulationRefusalArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  request: SimulationRequest;
  requestId: string;
  startTime: number;
  reason: string;
  heuristicCategory: boolean;
};
