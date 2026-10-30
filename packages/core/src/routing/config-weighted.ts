/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type {
  RoutingCategoryConfig,
  RoutingRuntimeState,
  WeightedCategoryState,
} from './config.js';
import type { ScoredCandidate } from './config-engine-shared.js';

/**
 * Selects the next model using Smooth Weighted Round Robin (SWRR) algorithm.
 * Returns the selected candidate and updated runtime state.
 *
 * SWRR algorithm:
 * - Each model has a static weight (from config) and a dynamic current weight
 * - On each selection: add the model weight to its current weight
 * - Select the model with the highest current weight
 * - Subtract the total weight from the selected model's current weight
 * - This produces a smooth distribution proportional to the configured weights
 *
 * Ties are broken by model ID ordering, so results are deterministic.
 * Accumulated state is discarded when the eligible candidate set or configured
 * weights change, so a new weight mix starts from a clean, unbiased state.
 */
export function selectWeightedCandidate({
  scoredCandidates,
  runtimeState,
  category,
}: SelectWeightedArgs): WeightedSelection {
  const eligibleCandidates = scoredCandidates.filter((candidate) => !candidate.excluded);
  if (eligibleCandidates.length === 0) {
    return { bestCandidate: null, updatedRuntimeState: runtimeState };
  }

  const orderedCandidates = [...eligibleCandidates].sort((a, b) =>
    a.model.id.localeCompare(b.model.id),
  );
  const eligibleModelIds = orderedCandidates.map((candidate) => candidate.model.id);
  const modelWeights = resolveModelWeights(orderedCandidates);
  const categoryState = runtimeState.weightedState?.[category.id];
  const currentWeights = restoreCurrentWeights(eligibleModelIds, modelWeights, categoryState);
  const totalWeight = addModelWeights({ eligibleModelIds, modelWeights, currentWeights });
  const bestModelId = selectModelId({
    eligibleModelIds,
    modelWeights,
    currentWeights,
    totalWeight,
  });

  if (bestModelId === null) {
    return { bestCandidate: null, updatedRuntimeState: runtimeState };
  }
  if (totalWeight > 0) {
    currentWeights[bestModelId] = (currentWeights[bestModelId] ?? 0) - totalWeight;
  }

  return {
    bestCandidate:
      orderedCandidates.find((candidate) => candidate.model.id === bestModelId) ?? null,
    updatedRuntimeState: withCategoryState({
      runtimeState,
      categoryId: category.id,
      currentWeights,
      eligibleModelIds,
      modelWeights,
    }),
  };
}

/**
 * Gets the current Weighted routing state for a category without mutating it.
 * Useful for simulation/inspection.
 */
export function getWeightedState(
  runtimeState: RoutingRuntimeState | undefined,
  categoryId: string,
): WeightedCategoryState | undefined {
  return runtimeState?.weightedState?.[categoryId];
}

/**
 * Resets Weighted routing state for a specific category or all categories.
 */
export function resetWeightedState(
  runtimeState: RoutingRuntimeState,
  categoryId?: string,
): RoutingRuntimeState {
  const baseState = { ...runtimeState, lastUpdated: Date.now() };
  if (categoryId) {
    const { [categoryId]: _, ...remainingState } = runtimeState.weightedState ?? {};
    if (Object.keys(remainingState).length > 0) {
      return { ...baseState, weightedState: remainingState };
    }
    // Omit weightedState entirely when empty
    const { weightedState: _unused, ...rest } = baseState;
    return rest;
  }
  // Omit weightedState entirely when resetting all
  const { weightedState: _unused, ...rest } = baseState;
  return rest;
}

/**
 * Creates a snapshot of Weighted routing state for simulation (read-only).
 */
export function snapshotWeightedState(
  runtimeState: RoutingRuntimeState | undefined,
): Record<string, WeightedCategoryState> | undefined {
  if (!runtimeState?.weightedState) return undefined;
  return { ...runtimeState.weightedState };
}

function resolveModelWeights(candidates: ScoredCandidate[]): Map<string, number> {
  const modelWeights = new Map<string, number>();
  for (const candidate of candidates) {
    const weight = candidate.model.weight ?? 1;
    modelWeights.set(candidate.model.id, Number.isFinite(weight) && weight >= 0 ? weight : 0);
  }
  return modelWeights;
}

function restoreCurrentWeights(
  eligibleModelIds: string[],
  modelWeights: Map<string, number>,
  categoryState: WeightedCategoryState | undefined,
): Record<string, number> {
  const listUnchanged =
    categoryState !== undefined && arraysEqual(categoryState.eligibleModelIds, eligibleModelIds);
  const weightsUnchanged =
    categoryState !== undefined &&
    weightsEqual(categoryState.weights, modelWeights, eligibleModelIds);
  const previousWeights = categoryState?.currentWeights ?? {};
  const currentWeights: Record<string, number> = {};
  for (const modelId of eligibleModelIds) {
    // Reuse accumulated state only when both the candidate set and weights are unchanged.
    const reusable = listUnchanged && weightsUnchanged;
    currentWeights[modelId] = reusable ? (previousWeights[modelId] ?? 0) : 0;
  }
  return currentWeights;
}

function weightsEqual(
  previousWeights: Record<string, number> | undefined,
  modelWeights: Map<string, number>,
  eligibleModelIds: string[],
): boolean {
  if (previousWeights === undefined) return false;
  return eligibleModelIds.every(
    (modelId) => previousWeights[modelId] === (modelWeights.get(modelId) ?? 0),
  );
}

function toWeightRecord(
  modelWeights: Map<string, number>,
  eligibleModelIds: string[],
): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const modelId of eligibleModelIds) {
    weights[modelId] = modelWeights.get(modelId) ?? 0;
  }
  return weights;
}

function addModelWeights({
  eligibleModelIds,
  modelWeights,
  currentWeights,
}: AddModelWeightsArgs): number {
  let totalWeight = 0;
  for (const modelId of eligibleModelIds) {
    const weight = modelWeights.get(modelId) ?? 0;
    currentWeights[modelId] = (currentWeights[modelId] ?? 0) + weight;
    totalWeight += weight;
  }
  return totalWeight;
}

function selectModelId({
  eligibleModelIds,
  modelWeights,
  currentWeights,
  totalWeight,
}: SelectModelIdArgs): string | null {
  // With no positive weight, fall back to the first eligible model deterministically.
  if (totalWeight === 0) {
    return eligibleModelIds[0] ?? null;
  }
  let bestModelId: string | null = null;
  let maxCurrentWeight = -Infinity;
  for (const modelId of eligibleModelIds) {
    // Zero-weight models never receive selections, even with residual state.
    if ((modelWeights.get(modelId) ?? 0) <= 0) continue;
    const currentWeight = currentWeights[modelId] ?? 0;
    if (currentWeight > maxCurrentWeight) {
      maxCurrentWeight = currentWeight;
      bestModelId = modelId;
    }
  }
  return bestModelId ?? eligibleModelIds[0] ?? null;
}

function withCategoryState({
  runtimeState,
  categoryId,
  currentWeights,
  eligibleModelIds,
  modelWeights,
}: WithCategoryStateArgs): RoutingRuntimeState {
  return {
    ...runtimeState,
    weightedState: {
      ...(runtimeState.weightedState ?? {}),
      [categoryId]: {
        currentWeights,
        eligibleModelIds,
        weights: toWeightRecord(modelWeights, eligibleModelIds),
        lastUpdated: Date.now(),
      },
    },
    lastUpdated: Date.now(),
  };
}

type WeightedSelection = {
  bestCandidate: ScoredCandidate | null;
  updatedRuntimeState: RoutingRuntimeState;
};

type SelectWeightedArgs = {
  scoredCandidates: ScoredCandidate[];
  runtimeState: RoutingRuntimeState;
  category: RoutingCategoryConfig;
};

type AddModelWeightsArgs = {
  eligibleModelIds: string[];
  modelWeights: Map<string, number>;
  currentWeights: Record<string, number>;
};

type SelectModelIdArgs = {
  eligibleModelIds: string[];
  modelWeights: Map<string, number>;
  currentWeights: Record<string, number>;
  totalWeight: number;
};

type WithCategoryStateArgs = {
  runtimeState: RoutingRuntimeState;
  categoryId: string;
  currentWeights: Record<string, number>;
  eligibleModelIds: string[];
  modelWeights: Map<string, number>;
};

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
