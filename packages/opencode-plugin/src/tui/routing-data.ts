/**
 * Read-only routing selectors derived from the resolved configuration.
 *
 * These helpers keep the Overview and Routing views honest: every value comes
 * from the active configuration, and unavailable runtime data is not inferred.
 */

import {
  PREDEFINED_CATEGORIES,
  type ModelConfig,
  type ResolvedRoutingConfig,
  type RoutingCategoryId,
  type RoutingStrategyType,
} from '@opencode-quotaweave/core';

/** Re-export for consumers needing the authoritative category definitions. */
export { PREDEFINED_CATEGORIES } from '@opencode-quotaweave/core';

function isRoutingCategoryId(value: string): value is RoutingCategoryId {
  return Object.prototype.hasOwnProperty.call(PREDEFINED_CATEGORIES, value);
}

/** The ten fixed routing categories in their authoritative display order. */
export const ROUTING_CATEGORY_IDS: readonly RoutingCategoryId[] =
  Object.keys(PREDEFINED_CATEGORIES).filter(isRoutingCategoryId);

/** One category pool resolved against the approved model allowlist. */
export interface CategoryPool {
  readonly id: RoutingCategoryId;
  readonly name: string;
  readonly description: string;
  readonly configured: boolean;
  readonly enabled: boolean;
  readonly configuredModelCount: number;
  readonly assignedModels: readonly ModelConfig[];
  readonly enabledModelCount: number;
  readonly disabledModelCount: number;
  readonly unresolvedModelCount: number;
  readonly strategy: RoutingStrategyType;
  readonly strategyFromCategory: boolean;
  readonly effectiveWeights: Readonly<Record<RoutingStrategyType, number>>;
  readonly weightsFromCategory: boolean;
}

function modelIndex(config: ResolvedRoutingConfig): ReadonlyMap<string, ModelConfig> {
  return new Map(config.models.map((model) => [model.id, model]));
}

function buildCategoryPool(
  config: ResolvedRoutingConfig,
  id: RoutingCategoryId,
  models: ReadonlyMap<string, ModelConfig>,
): CategoryPool {
  const category = config.categories.find((candidate) => candidate.id === id);
  const definition = PREDEFINED_CATEGORIES[id];
  const assignedModels = category
    ? category.modelIds.flatMap((modelId) => {
        const model = models.get(modelId);
        return model ? [model] : [];
      })
    : [];
  const enabledModelCount = assignedModels.filter((model) => model.enabled).length;
  const unresolvedModelCount = category
    ? category.modelIds.filter((modelId) => !models.has(modelId)).length
    : 0;

  return {
    id,
    name: category?.name ?? definition.name,
    description: category?.description ?? definition.description,
    configured: category !== undefined,
    enabled: category?.enabled ?? false,
    configuredModelCount: category?.modelIds.length ?? 0,
    assignedModels,
    enabledModelCount,
    disabledModelCount: assignedModels.length - enabledModelCount,
    unresolvedModelCount,
    strategy: category?.defaultStrategy ?? config.defaultStrategy,
    strategyFromCategory: category?.defaultStrategy !== undefined,
    effectiveWeights: category?.strategyWeights ?? config.strategyWeights,
    weightsFromCategory: category?.strategyWeights !== undefined,
  };
}

/** Resolve all ten predefined categories, including ones not configured. */
export function buildCategoryPools(config: ResolvedRoutingConfig): CategoryPool[] {
  const models = modelIndex(config);
  return ROUTING_CATEGORY_IDS.map((id) => buildCategoryPool(config, id, models));
}

/** Derived configuration readiness, not a runtime availability signal. */
export type RoutingReadiness =
  'ready' | 'no-models' | 'no-enabled-models' | 'no-enabled-categories' | 'no-enabled-candidates';

/** High-level routing summary used by Overview and the Routing header. */
export interface RoutingSummary {
  readonly approvedModelCount: number;
  readonly enabledModelCount: number;
  readonly disabledModelCount: number;
  readonly configuredCategoryCount: number;
  readonly enabledCategoryCount: number;
  readonly categoriesWithEnabledModels: number;
  readonly defaultCategory: string;
  readonly defaultCategoryName: string;
  readonly defaultStrategy: RoutingStrategyType;
  readonly effectiveWeights: Readonly<Record<RoutingStrategyType, number>>;
  readonly freeOnly: boolean;
  readonly maxCostPerRequest: number | undefined;
  readonly maxCostPerSession: number | undefined;
  readonly warnThreshold: number | undefined;
  readonly budgetPeriodHours: number | undefined;
  readonly cooldownEnabled: boolean;
  readonly readiness: RoutingReadiness;
}

/** Summarize the active routing configuration without inventing runtime data. */
export function summarizeRouting(
  config: ResolvedRoutingConfig,
  pools: readonly CategoryPool[] = buildCategoryPools(config),
): RoutingSummary {
  const enabledModelCount = config.models.filter((model) => model.enabled).length;
  const enabledCategoryCount = pools.filter((pool) => pool.enabled).length;
  const categoriesWithEnabledModels = pools.filter(
    (pool) => pool.enabled && pool.enabledModelCount > 0,
  ).length;

  let readiness: RoutingReadiness = 'ready';
  if (config.models.length === 0) readiness = 'no-models';
  else if (enabledModelCount === 0) readiness = 'no-enabled-models';
  else if (enabledCategoryCount === 0) readiness = 'no-enabled-categories';
  else if (categoriesWithEnabledModels === 0) readiness = 'no-enabled-candidates';

  return {
    approvedModelCount: config.models.length,
    enabledModelCount,
    disabledModelCount: config.models.length - enabledModelCount,
    configuredCategoryCount: pools.filter((pool) => pool.configured).length,
    enabledCategoryCount,
    categoriesWithEnabledModels,
    defaultCategory: config.defaultCategory,
    defaultCategoryName:
      pools.find((pool) => pool.id === config.defaultCategory)?.name ?? config.defaultCategory,
    defaultStrategy: config.defaultStrategy,
    effectiveWeights: config.strategyWeights,
    freeOnly: config.costPolicy.freeOnly,
    maxCostPerRequest: config.costPolicy.maxCostPerRequest,
    maxCostPerSession: config.costPolicy.maxCostPerSession,
    warnThreshold: config.costPolicy.warnThreshold,
    budgetPeriodHours: config.costPolicy.budgetPeriodHours,
    cooldownEnabled: config.cooldownConfig.enabled,
    readiness,
  };
}

const READINESS_DETAIL: Readonly<Record<RoutingReadiness, string>> = {
  ready: 'Enabled categories contain at least one enabled model.',
  'no-models': 'The approved model allowlist is empty.',
  'no-enabled-models': 'Approved models exist but none are enabled.',
  'no-enabled-categories': 'No routing categories are enabled.',
  'no-enabled-candidates': 'Enabled categories contain no enabled models.',
};

/** Explain the derived readiness state without presenting a health score. */
export function readinessDetail(readiness: RoutingReadiness): string {
  return READINESS_DETAIL[readiness];
}

function unresolvedFallbackCount(config: ResolvedRoutingConfig): number {
  const modelIds = new Set(config.models.map((model) => model.id));
  return config.models.reduce(
    (total, model) =>
      total + (model.fallbacks?.filter((fallback) => !modelIds.has(fallback)).length ?? 0),
    0,
  );
}

function collectPoolWarnings(pools: readonly CategoryPool[], enabledModels: number): string[] {
  const warnings: string[] = [];
  const configuredPools = pools.filter((pool) => pool.configured);
  if (configuredPools.length === 0) {
    warnings.push('No routing categories are configured.');
    return warnings;
  }

  const missingCategories = pools.length - configuredPools.length;
  if (missingCategories > 0) {
    warnings.push(`${missingCategories} predefined categories are not configured.`);
  }
  if (pools.every((pool) => !pool.enabled)) {
    warnings.push('No routing categories are enabled.');
  }
  if (enabledModels > 0) {
    const withoutModels = pools.filter(
      (pool) => pool.enabled && pool.enabledModelCount === 0,
    ).length;
    if (withoutModels > 0) {
      warnings.push(`${withoutModels} enabled categories have no enabled models.`);
    }
    const emptyPools = configuredPools.filter((pool) => pool.assignedModels.length === 0).length;
    if (emptyPools > 0) {
      warnings.push(`${emptyPools} configured categories have no approved models.`);
    }
  }
  const unresolvedCategories = pools.reduce((total, pool) => total + pool.unresolvedModelCount, 0);
  if (unresolvedCategories > 0) {
    warnings.push(
      `${unresolvedCategories} category model references are not in the approved allowlist.`,
    );
  }
  return warnings;
}

/** Derive configuration warnings from the active resolved configuration. */
export function collectRoutingWarnings(
  config: ResolvedRoutingConfig,
  pools: readonly CategoryPool[] = buildCategoryPools(config),
): readonly string[] {
  const warnings: string[] = [];
  const enabledModels = config.models.filter((model) => model.enabled).length;

  if (config.models.length === 0) warnings.push('The approved model allowlist is empty.');
  else if (enabledModels === 0) warnings.push('No approved models are enabled.');

  warnings.push(...collectPoolWarnings(pools, enabledModels));

  const unresolvedFallbacks = unresolvedFallbackCount(config);
  if (unresolvedFallbacks > 0) {
    warnings.push(`${unresolvedFallbacks} fallback references are not in the approved allowlist.`);
  }
  if (!pools.some((pool) => pool.id === config.defaultCategory)) {
    warnings.push(`The default category "${config.defaultCategory}" is not configured.`);
  }
  return warnings;
}

/** Initial category selection, falling back to the first predefined category. */
export function initialRoutingCategory(config: ResolvedRoutingConfig): RoutingCategoryId {
  return isRoutingCategoryId(config.defaultCategory)
    ? config.defaultCategory
    : (ROUTING_CATEGORY_IDS[0] ?? 'general');
}
