/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { createRefusalResult } from './config-create-refusal-result.js';
import type { ScoredCandidate } from './config-engine-shared.js';
import { generateReason } from './config-generate-reason.js';
import { getCandidatesForCategory } from './config-get-candidates-for-category.js';
import { modelToCandidate } from './config-model-to-candidate.js';
import { resolveCategory } from './config-resolve-category.js';
import { scoreCandidates } from './config-score-candidates.js';
import { selectRoundRobinCandidate } from './config-round-robin.js';
import { selectWeightedCandidate } from './config-weighted.js';
import type {
  ConfigRouteRequest,
  ConfigRouteResult,
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingRuntimeState,
} from './config.js';
import type { RouteResultWithState } from './config-engine.js';
export function routeInternal({
  resolvedConfig,
  request,
}: RouteInternalArgs): RouteResultWithState {
  const startTime = Date.now();
  const runtimeState = request.runtimeState ?? {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };
  // Resolve category
  const category = resolveCategory({
    resolvedConfig: resolvedConfig,
    categoryId: request.category,
  });
  if (!category) {
    const refusal = createRefusalResult({
      resolvedConfig: resolvedConfig,
      request: request,
      reason: `Category '${request.category ?? resolvedConfig.defaultCategory}' not found or disabled`,
      startTime: startTime,
      scoredCandidates: undefined,
      options: { noCategory: true },
    });
    return { result: refusal, updatedRuntimeState: runtimeState };
  }
  // Get candidate models for this category
  const candidates = getCandidatesForCategory({
    resolvedConfig: resolvedConfig,
    category: category,
  });
  if (candidates.length === 0) {
    const refusal = createRefusalResult({
      resolvedConfig: resolvedConfig,
      request: request,
      reason: `No models available in category '${category.id}'`,
      startTime: startTime,
    });
    return { result: refusal, updatedRuntimeState: runtimeState };
  }
  // Apply filters and score candidates
  return scoreRoute({ resolvedConfig, request, candidates, category, startTime, runtimeState });
}
type RouteInternalArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  request: ConfigRouteRequest;
};
function buildRouteResult({
  scoredCandidates,
  bestCandidate,
  resolvedConfig,
  category,
  startTime,
  request,
}: BuildRouteResultArgs): ConfigRouteResult {
  const alternatives = scoredCandidates
    .filter((c) => !c.excluded && c.model.id !== bestCandidate.model.id)
    .slice(0, 3)
    .map((c) =>
      modelToCandidate({
        model: c.model,
      }),
    );
  // Build rejection reasons map
  const rejectionReasons: Record<string, string[]> = {};
  for (const c of scoredCandidates) {
    if (c.excluded && c.exclusionReasons.length > 0) {
      rejectionReasons[c.model.id] = c.exclusionReasons;
    }
  }
  return {
    selectedModel: modelToCandidate({
      model: bestCandidate.model,
    }),
    alternatives,
    reason: generateReason({
      best: bestCandidate,
      category: category,
    }),
    confidence: Math.min(bestCandidate.score, 1.0),
    rejectionReasons,
    metadata: {
      decisionTimeMs: Date.now() - startTime,
      strategy: category.defaultStrategy ?? resolvedConfig.defaultStrategy,
      category: category.id,
      candidatesEvaluated: scoredCandidates.length,
      scoreBreakdown: bestCandidate.breakdown,
      requestId: request.context.requestId,
    },
  };
}
type BuildRouteResultArgs = {
  scoredCandidates: ScoredCandidate[];
  bestCandidate: ScoredCandidate;
  resolvedConfig: ResolvedRoutingConfig;
  category: RoutingCategoryConfig;
  startTime: number;
  request: ConfigRouteRequest;
};
function selectBestCandidate(
  scoredCandidates: ScoredCandidate[],
  strategy: string,
  runtimeState: RoutingRuntimeState,
  category: RoutingCategoryConfig,
): { bestCandidate: ScoredCandidate | null; updatedRuntimeState: RoutingRuntimeState } {
  if (strategy === 'round-robin') {
    // Use Round Robin selection
    return selectRoundRobinCandidate({
      scoredCandidates,
      runtimeState,
      category,
    });
  }
  if (strategy === 'weighted') {
    // Use Weighted selection (Smooth Weighted Round Robin)
    return selectWeightedCandidate({
      scoredCandidates,
      runtimeState,
      category,
    });
  }
  // Use score-based selection (first non-excluded after sorting by score)
  return {
    bestCandidate: scoredCandidates.find((c) => !c.excluded) ?? null,
    updatedRuntimeState: runtimeState,
  };
}
function scoreRoute({
  resolvedConfig,
  request,
  candidates,
  category,
  startTime,
  runtimeState,
}: RouteInternalArgs & {
  candidates: ModelConfig[];
  category: RoutingCategoryConfig;
  startTime: number;
  runtimeState: RoutingRuntimeState;
}): RouteResultWithState {
  const scoredCandidates = scoreCandidates({
    resolvedConfig: resolvedConfig,
    models: candidates,
    request: request,
    category: category,
  });
  // Determine strategy
  const strategy = category.defaultStrategy ?? resolvedConfig.defaultStrategy;
  const { bestCandidate, updatedRuntimeState } = selectBestCandidate(
    scoredCandidates,
    strategy,
    runtimeState,
    category,
  );
  if (!bestCandidate) {
    const refusal = createRefusalResult({
      resolvedConfig: resolvedConfig,
      request: request,
      reason: 'All candidates excluded by policy',
      startTime: startTime,
      scoredCandidates: scoredCandidates,
      options: { noMatch: true },
    });
    return { result: refusal, updatedRuntimeState };
  }
  // Build alternatives (next best non-excluded candidates)
  const result = buildRouteResult({
    scoredCandidates: scoredCandidates,
    bestCandidate: bestCandidate,
    resolvedConfig: resolvedConfig,
    category: category,
    startTime: startTime,
    request: request,
  });
  return { result, updatedRuntimeState };
}
