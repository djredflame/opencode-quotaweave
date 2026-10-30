/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { calculateTotalScore } from './config-calculate-total-score.js';
import { createSimulationRefusal } from './config-create-simulation-refusal.js';
import { STRATEGY_WEIGHTS, type ScoredCandidate } from './config-engine-shared.js';
import { getActiveCooldowns } from './config-get-active-cooldowns.js';
import { getCandidatesForCategory } from './config-get-candidates-for-category.js';
import { getEmptyRuntimeState } from './config-get-empty-runtime-state.js';
import { resolveCategoryWithHeuristic } from './config-resolve-category-with-heuristic.js';
import { scoreCandidatesForSimulation } from './config-score-candidates-for-simulation.js';
import type {
  CostPolicyConfig,
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingRuntimeState,
  SimulationRequest,
  SimulationResult,
} from './config.js';
import type { ScoreBreakdown } from './types.js';
export function simulateInternal({
  resolvedConfig,
  request,
  runtimeState,
  requestId,
  startTime,
}: SimulateInternalArgs): SimulationResult {
  // Resolve category (explicit or heuristic)
  const { category, heuristicCategory } = resolveCategoryWithHeuristic({
    resolvedConfig: resolvedConfig,
    categoryId: request.category,
    taskDescription: request.task,
  });
  const refusalContext = { resolvedConfig, request, requestId, startTime, heuristicCategory };
  if (!category) {
    return createSimulationRefusal({
      ...refusalContext,
      reason: `Category '${request.category ?? 'auto'}' not found or disabled`,
    });
  }
  // Get candidate models for this category
  const modelConfigs = getCandidatesForCategory({
    resolvedConfig: resolvedConfig,
    category: category,
  });
  if (modelConfigs.length === 0) {
    return createSimulationRefusal({
      ...refusalContext,
      reason: `No models available in category '${category.id}'`,
    });
  }
  // Apply cost policy override if provided
  const { scoredCandidates, simRuntimeState, costPolicy } = prepareSimulationCandidates({
    request: request,
    resolvedConfig: resolvedConfig,
    runtimeState: runtimeState,
    modelConfigs: modelConfigs,
    category: category,
  });
  // Find best candidate
  return buildSimulationResult({
    scoredCandidates: scoredCandidates,
    resolvedConfig: resolvedConfig,
    simRuntimeState: simRuntimeState,
    modelConfigs: modelConfigs,
    category: category,
    costPolicy: costPolicy,
    requestId: requestId,
    startTime: startTime,
    heuristicCategory: heuristicCategory,
  });
}
type SimulateInternalArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  request: SimulationRequest;
  runtimeState: RoutingRuntimeState | undefined;
  requestId: string;
  startTime: number;
};
function prepareSimulationCandidates({
  request,
  resolvedConfig,
  runtimeState,
  modelConfigs,
  category,
}: PrepareSimulationCandidatesArgs) {
  const costPolicy = request.costPolicy
    ? { ...resolvedConfig.costPolicy, ...request.costPolicy }
    : resolvedConfig.costPolicy;
  // Build runtime state for simulation
  const simRuntimeState = runtimeState ?? getEmptyRuntimeState();
  // Score all candidates
  const scoredCandidates = scoreCandidatesForSimulation({
    resolvedConfig: resolvedConfig,
    models: modelConfigs,
    request: request,
    category: category,
    costPolicy: costPolicy,
    runtimeState: simRuntimeState,
  });
  return { scoredCandidates, simRuntimeState, costPolicy };
}
function buildSimulationResult({
  scoredCandidates,
  resolvedConfig,
  simRuntimeState,
  modelConfigs,
  category,
  costPolicy,
  requestId,
  startTime,
  heuristicCategory,
}: BuildSimulationResultArgs) {
  const bestCandidate = scoredCandidates.find((c) => !c.excluded);
  // Build active cooldowns
  const activeCooldowns = getActiveCooldowns({
    runtimeState: simRuntimeState,
    models: modelConfigs,
  });
  const permitted = bestCandidate != null;
  const rejectionReason = permitted ? '' : 'All candidates excluded by policy';
  // Convert internal ScoreBreakdown to simulation format (with totalScore)
  const toSimulationBreakdown = createSimulationBreakdown(resolvedConfig, category);
  return {
    category: category.id,
    candidates: scoredCandidates.map((c) => ({
      model: c.model,
      excluded: c.excluded,
      exclusionReasons: c.exclusionReasons,
      scoreBreakdown: toSimulationBreakdown(c.breakdown),
    })),
    selectedModel: bestCandidate
      ? {
          model: bestCandidate.model,
          excluded: false,
          exclusionReasons: [],
          scoreBreakdown: toSimulationBreakdown(bestCandidate.breakdown),
        }
      : null,
    costPolicy,
    activeCooldowns,
    permitted,
    rejectionReason,
    metadata: {
      timestamp: Date.now(),
      requestId,
      strategy: category.defaultStrategy ?? resolvedConfig.defaultStrategy,
      decisionTimeMs: Date.now() - startTime,
      heuristicCategory,
    },
  };
}
type BuildSimulationResultArgs = {
  scoredCandidates: ScoredCandidate[];
  resolvedConfig: ResolvedRoutingConfig;
  simRuntimeState: RoutingRuntimeState;
  modelConfigs: ModelConfig[];
  category: RoutingCategoryConfig;
  costPolicy: CostPolicyConfig;
  requestId: string;
  startTime: number;
  heuristicCategory: boolean;
};
type PrepareSimulationCandidatesArgs = {
  request: SimulationRequest;
  resolvedConfig: ResolvedRoutingConfig;
  runtimeState: RoutingRuntimeState | undefined;
  modelConfigs: ModelConfig[];
  category: RoutingCategoryConfig;
};
function createSimulationBreakdown(
  resolvedConfig: ResolvedRoutingConfig,
  category: RoutingCategoryConfig,
) {
  return (breakdown: ScoreBreakdown) => ({
    capabilityMatch: breakdown.capabilityMatch,
    costScore: breakdown.costScore,
    latencyScore: breakdown.latencyScore,
    quotaScore: breakdown.quotaScore,
    priorityScore: breakdown.priorityScore,
    totalScore: calculateTotalScore({
      breakdown: breakdown,
      weights: STRATEGY_WEIGHTS[category.defaultStrategy ?? resolvedConfig.defaultStrategy],
    }),
  });
}
