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
  RoundRobinCategoryState,
} from './config.js';
import type { ScoredCandidate } from './config-engine-shared.js';

/**
 * Selects the next model using Round Robin strategy.
 * Returns the selected candidate and updated runtime state.
 */
export function selectRoundRobinCandidate({
  scoredCandidates,
  runtimeState,
  category,
}: SelectRoundRobinArgs): {
  bestCandidate: ScoredCandidate | null;
  updatedRuntimeState: RoutingRuntimeState;
} {
  // Filter non-excluded candidates
  const eligibleCandidates = scoredCandidates.filter((c) => !c.excluded);

  if (eligibleCandidates.length === 0) {
    return { bestCandidate: null, updatedRuntimeState: runtimeState };
  }

  // Create a deterministic ordering by model ID
  const orderedCandidates = [...eligibleCandidates].sort((a, b) =>
    a.model.id.localeCompare(b.model.id),
  );
  const eligibleModelIds = orderedCandidates.map((c) => c.model.id);

  // Get or initialize category rotation state
  const roundRobinState = runtimeState.roundRobinState ?? {};
  const categoryState = roundRobinState[category.id];

  // Check if the eligible model list has changed (models added/removed)
  const modelListChanged =
    !categoryState || !arraysEqual(categoryState.eligibleModelIds, eligibleModelIds);

  let nextIndex: number;
  if (modelListChanged || categoryState === undefined) {
    // Reset to first model if list changed or no prior state
    nextIndex = 0;
  } else {
    // Move to next index, wrapping around
    nextIndex = (categoryState.lastSelectedIndex + 1) % orderedCandidates.length;
  }

  const bestCandidate = orderedCandidates[nextIndex] ?? null;

  // Update rotation state
  const updatedRoundRobinState: Record<string, RoundRobinCategoryState> = {
    ...roundRobinState,
    [category.id]: {
      lastSelectedIndex: nextIndex,
      eligibleModelIds,
      lastUpdated: Date.now(),
    },
  };

  const updatedRuntimeState: RoutingRuntimeState = {
    ...runtimeState,
    roundRobinState: updatedRoundRobinState,
    lastUpdated: Date.now(),
  };

  return { bestCandidate, updatedRuntimeState };
}

/**
 * Gets the current Round Robin state for a category without mutating it.
 * Useful for simulation/inspection.
 */
export function getRoundRobinState(
  runtimeState: RoutingRuntimeState | undefined,
  categoryId: string,
): RoundRobinCategoryState | undefined {
  return runtimeState?.roundRobinState?.[categoryId];
}

/**
 * Resets Round Robin state for a specific category or all categories.
 */
export function resetRoundRobinState(
  runtimeState: RoutingRuntimeState,
  categoryId?: string,
): RoutingRuntimeState {
  const baseState = { ...runtimeState, lastUpdated: Date.now() };
  if (categoryId) {
    const { [categoryId]: _, ...remainingState } = runtimeState.roundRobinState ?? {};
    if (Object.keys(remainingState).length > 0) {
      return { ...baseState, roundRobinState: remainingState };
    }
    // Omit roundRobinState entirely when empty
    const { roundRobinState: _unused, ...rest } = baseState;
    return rest;
  }
  // Omit roundRobinState entirely when resetting all
  const { roundRobinState: _unused, ...rest } = baseState;
  return rest;
}

/**
 * Creates a snapshot of Round Robin state for simulation (read-only).
 */
export function snapshotRoundRobinState(
  runtimeState: RoutingRuntimeState | undefined,
): Record<string, RoundRobinCategoryState> | undefined {
  if (!runtimeState?.roundRobinState) return undefined;
  return { ...runtimeState.roundRobinState };
}

type SelectRoundRobinArgs = {
  scoredCandidates: ScoredCandidate[];
  runtimeState: RoutingRuntimeState;
  category: RoutingCategoryConfig;
};

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}
