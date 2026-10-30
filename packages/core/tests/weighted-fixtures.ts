/** Shared helpers for Weighted routing tests. */
import type { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import type {
  ConfigRouteRequest,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingCategoryId,
  RoutingRuntimeState,
  RoutingStrategyType,
} from '../src/routing/config.js';
import type { CoreContext } from '../src/types.js';
import { CATEGORY_FIXTURES, MODEL_FIXTURES, buildTestResolvedConfig } from './config-fixtures.js';

/** Alphabetical order used by weighted and round-robin scheduling. */
export const WEIGHTED_MODEL_IDS = ['test/fast-model', 'test/free-model', 'test/paid-model'];

export function createWeightedConfig(
  weights: Record<string, number>,
  strategy: RoutingStrategyType = 'weighted',
  categoryId: RoutingCategoryId = 'coding',
  modelIds: string[] = WEIGHTED_MODEL_IDS,
): ResolvedRoutingConfig {
  const models = structuredClone(MODEL_FIXTURES).map((model) => ({
    ...model,
    weight: weights[model.id] ?? model.weight ?? 1,
  }));
  const category: RoutingCategoryConfig = {
    id: categoryId,
    name: categoryId,
    description: 'Weighted routing test',
    modelIds: [...modelIds],
    defaultStrategy: strategy,
    enabled: true,
  };
  const categories = structuredClone(CATEGORY_FIXTURES).filter((c) => c.id !== categoryId);
  return buildTestResolvedConfig(models, [...categories, category]);
}

export function createContext(): CoreContext {
  return { requestId: 'test-request', timestamp: Date.now(), sessionId: 'test-session' };
}

export function createWeightedRequest(
  resolvedConfig: ResolvedRoutingConfig,
  overrides: Partial<ConfigRouteRequest> = {},
): ConfigRouteRequest {
  return {
    task: 'Implement a REST API',
    category: 'coding',
    requiredCapabilities: ['coding'],
    context: createContext(),
    resolvedConfig,
    ...overrides,
  };
}

export function routeSequence(
  engine: ConfigRoutingEngine,
  resolvedConfig: ResolvedRoutingConfig,
  count: number,
  overrides: Partial<ConfigRouteRequest> = {},
): { ids: string[]; runtimeState: RoutingRuntimeState } {
  const ids: string[] = [];
  let runtimeState: RoutingRuntimeState = {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };
  for (let index = 0; index < count; index++) {
    const outcome = engine.route({
      ...createWeightedRequest(resolvedConfig, overrides),
      runtimeState,
    });
    ids.push(outcome.result.selectedModel?.id ?? 'none');
    runtimeState = outcome.updatedRuntimeState;
  }
  return { ids, runtimeState };
}

export function countSelections(ids: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
