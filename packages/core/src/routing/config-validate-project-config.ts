/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { isValidStrategy } from './config-is-valid-strategy.js';
import { validateCategories } from './config-validate-categories.js';
import { validateCooldownConfig } from './config-validate-cooldown-config.js';
import { validateCostPolicy } from './config-validate-cost-policy.js';
import { validateModels } from './config-validate-models.js';
import { validateShadowMode } from './config-validate-shadow-mode.js';
import { validateStrategyWeights } from './config-validate-strategy-weights.js';
import {
  CONFIG_SCHEMA_VERSION,
  type ConfigValidationError,
  type ConfigValidationResult,
  type ConfigValidationWarning,
  type GlobalRoutingConfig,
  type ModelConfig,
  type RoutingCategoryConfig,
} from './config.js';
export function validateProjectConfig(
  config: unknown,
  globalConfig: GlobalRoutingConfig,
): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: ConfigValidationWarning[] = [];
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: [{ code: 'INVALID_CONFIG', message: 'Configuration must be an object', path: '' }],
      warnings,
    };
  }
  const cfg = config as Record<string, unknown>;
  // Validate version
  validateProjectIdentity(cfg, errors, globalConfig, warnings);
  // Validate models (if provided) - must be subset of global
  validateProjectModels(cfg, globalConfig, errors, warnings);
  // Validate categories (if provided) - must be subset of global
  validateProjectCategories(cfg, globalConfig, errors, warnings);
  // Validate optional overrides
  validateProjectOptions(cfg, errors, warnings);
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
function validateProjectIdentity(
  cfg: Record<string, unknown>,
  errors: ConfigValidationError[],
  globalConfig: GlobalRoutingConfig,
  warnings: ConfigValidationWarning[],
) {
  if (cfg.version !== CONFIG_SCHEMA_VERSION) {
    errors.push({
      code: 'VERSION_MISMATCH',
      message: `Configuration version must be ${CONFIG_SCHEMA_VERSION}, got ${String(cfg.version)}`,
      path: 'version',
      value: cfg.version,
    });
  }
  // Validate projectId
  if (typeof cfg.projectId !== 'string' || !cfg.projectId) {
    errors.push({
      code: 'MISSING_PROJECT_ID',
      message: 'projectId is required',
      path: 'projectId',
    });
  }
  // Validate globalConfigVersion
  if (typeof cfg.globalConfigVersion !== 'string' || !cfg.globalConfigVersion) {
    errors.push({
      code: 'MISSING_GLOBAL_VERSION',
      message: 'globalConfigVersion is required',
      path: 'globalConfigVersion',
    });
  } else if (cfg.globalConfigVersion !== globalConfig.version) {
    warnings.push({
      code: 'GLOBAL_VERSION_MISMATCH',
      message: `Project config references global version ${cfg.globalConfigVersion}, but current global is ${globalConfig.version}`,
      path: 'globalConfigVersion',
    });
  }
}
function validateProjectModels(
  cfg: Record<string, unknown>,
  globalConfig: GlobalRoutingConfig,
  errors: ConfigValidationError[],
  warnings: ConfigValidationWarning[],
) {
  if (Array.isArray(cfg.models)) {
    const globalModelIds = new Set(globalConfig.models.map((m) => m.id));
    for (const model of cfg.models) {
      if (typeof model !== 'object' || !model || !('id' in model)) continue;
      const modelId = (model as ModelConfig).id;
      if (!globalModelIds.has(modelId)) {
        errors.push({
          code: 'MODEL_NOT_IN_GLOBAL',
          message: `Model ${modelId} is not in global allowlist. Project configs cannot add models.`,
          path: 'models',
          value: modelId,
        });
      }
    }
    validateModels(cfg.models, errors, warnings, 'models');
  }
}
function validateProjectCategories(
  cfg: Record<string, unknown>,
  globalConfig: GlobalRoutingConfig,
  errors: ConfigValidationError[],
  warnings: ConfigValidationWarning[],
) {
  if (Array.isArray(cfg.categories)) {
    const globalCategoryIds = new Set(globalConfig.categories.map((c) => c.id));
    for (const cat of cfg.categories) {
      if (typeof cat !== 'object' || !cat || !('id' in cat)) continue;
      const catId = (cat as RoutingCategoryConfig).id;
      if (!globalCategoryIds.has(catId)) {
        errors.push({
          code: 'CATEGORY_NOT_IN_GLOBAL',
          message: `Category ${catId} is not in global config. Project configs cannot add categories.`,
          path: 'categories',
          value: catId,
        });
      }
    }
    validateCategories({
      categories: cfg.categories,
      globalModels: globalConfig.models,
      errors: errors,
      warnings: warnings,
      pathPrefix: 'categories',
    });
  }
}
function validateProjectOptions(
  cfg: Record<string, unknown>,
  errors: ConfigValidationError[],
  warnings: ConfigValidationWarning[],
) {
  if (
    cfg.defaultCategory !== undefined &&
    (typeof cfg.defaultCategory !== 'string' || !cfg.defaultCategory)
  ) {
    errors.push({
      code: 'INVALID_DEFAULT_CATEGORY',
      message: 'defaultCategory must be a non-empty string',
      path: 'defaultCategory',
      value: cfg.defaultCategory,
    });
  }
  if (cfg.defaultStrategy !== undefined && !isValidStrategy(cfg.defaultStrategy)) {
    errors.push({
      code: 'INVALID_DEFAULT_STRATEGY',
      message: `defaultStrategy must be a valid strategy type`,
      path: 'defaultStrategy',
      value: cfg.defaultStrategy,
    });
  }
  if (cfg.strategyWeights !== undefined) {
    validateStrategyWeights(cfg.strategyWeights, errors, 'strategyWeights');
  }
  if (cfg.costPolicy !== undefined) {
    validateCostPolicy({
      policy: cfg.costPolicy,
      errors: errors,
      _warnings: warnings,
      path: 'costPolicy',
      isProjectOverride: true,
    });
  }
  if (cfg.cooldownConfig !== undefined) {
    validateCooldownConfig(cfg.cooldownConfig, errors, warnings, 'cooldownConfig');
  }
  if (cfg.shadowMode !== undefined) {
    validateShadowMode(cfg.shadowMode, errors, warnings, 'shadowMode');
  }
}
