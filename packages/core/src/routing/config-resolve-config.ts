/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import {
  type GlobalRoutingConfig,
  type ModelConfig,
  type ProjectRoutingConfig,
  type ResolvedRoutingConfig,
  type RoutingCategoryConfig,
} from './config.js';
export function resolveConfig(
  global: GlobalRoutingConfig,
  project?: ProjectRoutingConfig,
): ResolvedRoutingConfig {
  // Start with global config
  const models = [...global.models];
  const categories = [...global.categories];
  let defaultCategory = global.defaultCategory;
  let defaultStrategy = global.defaultStrategy;
  const strategyWeights = { ...global.strategyWeights };
  const costPolicy = { ...global.costPolicy };
  const cooldownConfig = { ...global.cooldownConfig };
  const shadowMode = { ...global.shadowMode };
  const multiAgent = global.multiAgent ? { ...global.multiAgent } : undefined;
  if (project) {
    // Restrict models if project specifies
    restrictModels(project, models);
    // Restrict categories if project specifies
    restrictCategories(project, categories, models);
    // Override defaults
    ({ defaultCategory, defaultStrategy } = applyProjectDefaults({
      project: project,
      defaultCategory: defaultCategory,
      defaultStrategy: defaultStrategy,
      strategyWeights: strategyWeights,
      costPolicy: costPolicy,
      cooldownConfig: cooldownConfig,
      shadowMode: shadowMode,
    }));
  }
  // Ensure defaultCategory exists in resolved categories
  if (!categories.some((c) => c.id === defaultCategory)) {
    const firstEnabled = categories.find((c) => c.enabled);
    if (firstEnabled) {
      defaultCategory = firstEnabled.id;
    }
  }
  const result: ResolvedRoutingConfig = {
    models,
    categories,
    defaultCategory,
    defaultStrategy,
    strategyWeights,
    costPolicy,
    cooldownConfig,
    shadowMode,
  };
  if (multiAgent) {
    result.multiAgent = multiAgent;
  }
  return result;
}
function restrictModels(project: ProjectRoutingConfig, models: ModelConfig[]) {
  if (project.models) {
    const projectModelIds = new Set(project.models.map((m) => m.id));
    // Keep only models that are in project config
    const filteredModels = models.filter((m) => projectModelIds.has(m.id));
    // Apply any property overrides from project models
    for (const pm of project.models) {
      const idx = filteredModels.findIndex((m) => m.id === pm.id);
      if (idx >= 0) {
        filteredModels[idx] = { ...filteredModels[idx], ...pm };
      }
    }
    models.length = 0;
    models.push(...filteredModels);
  }
}
function restrictCategories(
  project: ProjectRoutingConfig,
  categories: RoutingCategoryConfig[],
  models: ModelConfig[],
) {
  if (project.categories) {
    const projectCategoryIds = new Set(project.categories.map((c) => c.id));
    const filteredCategories = categories.filter((c) => projectCategoryIds.has(c.id));
    // Apply any property overrides from project categories
    for (const pc of project.categories) {
      const idx = filteredCategories.findIndex((c) => c.id === pc.id);
      if (idx >= 0) {
        filteredCategories[idx] = { ...filteredCategories[idx], ...pc };
        // Also filter modelIds to only include models that exist in resolved models
        const resolvedModelIds = new Set(models.map((m) => m.id));
        filteredCategories[idx].modelIds = pc.modelIds.filter((mid) => resolvedModelIds.has(mid));
      }
    }
    categories.length = 0;
    categories.push(...filteredCategories);
  }
}
function applyProjectDefaults({
  project,
  defaultCategory,
  defaultStrategy,
  strategyWeights,
  costPolicy,
  cooldownConfig,
  shadowMode,
}: ApplyProjectDefaultsArgs) {
  if (project.defaultCategory) {
    defaultCategory = project.defaultCategory;
  }
  if (project.defaultStrategy) {
    defaultStrategy = project.defaultStrategy;
  }
  if (project.strategyWeights) {
    Object.assign(strategyWeights, project.strategyWeights);
  }
  if (project.costPolicy) {
    Object.assign(costPolicy, project.costPolicy);
  }
  if (project.cooldownConfig) {
    Object.assign(cooldownConfig, project.cooldownConfig);
  }
  if (project.shadowMode) {
    Object.assign(shadowMode, project.shadowMode);
  }
  return { defaultCategory, defaultStrategy };
}
type ApplyProjectDefaultsArgs = {
  project: ProjectRoutingConfig;
  defaultCategory: string;
  defaultStrategy: GlobalRoutingConfig['defaultStrategy'];
  strategyWeights: {
    'capability-match': number;
    'cost-optimize': number;
    'latency-optimize': number;
    'quota-aware': number;
    'priority-based': number;
    'round-robin': number;
    custom: number;
  };
  costPolicy: {
    freeOnly: boolean;
    maxCostPerRequest?: number;
    maxCostPerSession?: number;
    warnThreshold?: number;
    budgetPeriodHours?: number;
  };
  cooldownConfig: {
    enabled: boolean;
    defaultCooldownMs: number;
    maxCooldownMs: number;
    backoffMultiplier: number;
    resetOnSuccess: boolean;
  };
  shadowMode: {
    enabled: boolean;
    shadowModelIds?: string[];
    logDecisions: boolean;
    sampleRate: number;
  };
};
