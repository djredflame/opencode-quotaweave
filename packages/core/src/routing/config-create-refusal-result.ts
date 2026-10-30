/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { type ScoredCandidate } from './config-engine-shared.js';
import type { ConfigRouteRequest, ConfigRouteResult, ResolvedRoutingConfig } from './config.js';
export function createRefusalResult({
  resolvedConfig,
  request,
  reason,
  startTime,
  scoredCandidates,
  options,
}: CreateRefusalResultArgs): ConfigRouteResult {
  const rejectionReasons: Record<string, string[]> = {};
  if (scoredCandidates) {
    for (const c of scoredCandidates) {
      if (c.excluded && c.exclusionReasons.length > 0) {
        rejectionReasons[c.model.id] = c.exclusionReasons;
      }
    }
  }
  return {
    selectedModel: null,
    alternatives: [],
    reason,
    confidence: 0,
    rejectionReasons,
    metadata: {
      decisionTimeMs: Date.now() - startTime,
      strategy: resolvedConfig.defaultStrategy,
      category: request.category ?? resolvedConfig.defaultCategory,
      candidatesEvaluated: scoredCandidates?.length ?? 0,
      requestId: request.context.requestId,
      noCategory: options?.noCategory ?? false,
      noMatch: options?.noMatch ?? false,
    },
  };
}
type CreateRefusalResultArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  request: ConfigRouteRequest;
  reason: string;
  startTime: number;
  scoredCandidates?: ScoredCandidate[] | undefined;
  options?:
    | {
        noCategory?: boolean;
        noMatch?: boolean;
      }
    | undefined;
};
