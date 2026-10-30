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
import { validateMultiAgent } from './config-validate-multi-agent.js';
import { validateShadowMode } from './config-validate-shadow-mode.js';
import { validateStrategyWeights } from './config-validate-strategy-weights.js';
import {
  CONFIG_SCHEMA_VERSION,
  type ConfigValidationError,
  type ConfigValidationResult,
  type ConfigValidationWarning,
} from './config.js';
export function validateGlobalConfig(config: unknown): ConfigValidationResult {
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
  validateGlobalCollections(cfg, errors, warnings);
  // Validate defaultCategory
  validateGlobalDefaults(cfg, errors);
  // Validate costPolicy
  validateGlobalOptions(cfg, errors, warnings);
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
function validateGlobalCollections(
  cfg: Record<string, unknown>,
  errors: ConfigValidationError[],
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
  // Validate models array
  if (!Array.isArray(cfg.models)) {
    errors.push({ code: 'MISSING_MODELS', message: 'models array is required', path: 'models' });
  } else {
    validateModels(cfg.models, errors, warnings);
  }
  // Validate categories array
  if (!Array.isArray(cfg.categories)) {
    errors.push({
      code: 'MISSING_CATEGORIES',
      message: 'categories array is required',
      path: 'categories',
    });
  } else {
    validateCategories({
      categories: cfg.categories,
      globalModels: Array.isArray(cfg.models) ? cfg.models : [],
      errors: errors,
      warnings: warnings,
    });
  }
}
function validateGlobalDefaults(cfg: Record<string, unknown>, errors: ConfigValidationError[]) {
  if (typeof cfg.defaultCategory !== 'string' || !cfg.defaultCategory) {
    errors.push({
      code: 'INVALID_DEFAULT_CATEGORY',
      message: 'defaultCategory must be a non-empty string',
      path: 'defaultCategory',
      value: cfg.defaultCategory,
    });
  }
  // Validate defaultStrategy
  if (!isValidStrategy(cfg.defaultStrategy)) {
    errors.push({
      code: 'INVALID_DEFAULT_STRATEGY',
      message: `defaultStrategy must be a valid strategy type`,
      path: 'defaultStrategy',
      value: cfg.defaultStrategy,
    });
  }
  // Validate strategyWeights
  if (!validateStrategyWeights(cfg.strategyWeights, errors, 'strategyWeights')) {
    // errors already added
  }
}
function validateGlobalOptions(
  cfg: Record<string, unknown>,
  errors: ConfigValidationError[],
  warnings: ConfigValidationWarning[],
) {
  if (cfg.costPolicy) {
    validateCostPolicy({
      policy: cfg.costPolicy,
      errors: errors,
      _warnings: warnings,
      path: 'costPolicy',
    });
  } else {
    warnings.push({
      code: 'MISSING_COST_POLICY',
      message: 'costPolicy not specified, using defaults',
      path: 'costPolicy',
    });
  }
  // Validate cooldownConfig
  if (cfg.cooldownConfig) {
    validateCooldownConfig(cfg.cooldownConfig, errors, warnings, 'cooldownConfig');
  } else {
    warnings.push({
      code: 'MISSING_COOLDOWN_CONFIG',
      message: 'cooldownConfig not specified, using defaults',
      path: 'cooldownConfig',
    });
  }
  // Validate shadowMode
  if (cfg.shadowMode) {
    validateShadowMode(cfg.shadowMode, errors, warnings, 'shadowMode');
  } else {
    warnings.push({
      code: 'MISSING_SHADOW_MODE',
      message: 'shadowMode not specified, using defaults',
      path: 'shadowMode',
    });
  }
  // Validate multiAgent (optional)
  if (cfg.multiAgent) {
    validateMultiAgent(cfg.multiAgent, errors, warnings, 'multiAgent');
  }
}
