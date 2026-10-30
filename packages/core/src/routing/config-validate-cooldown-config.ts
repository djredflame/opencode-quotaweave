/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError, type ConfigValidationWarning } from './config.js';
export function validateCooldownConfig(
  config: unknown,
  errors: ConfigValidationError[],
  _warnings: ConfigValidationWarning[],
  path: string,
): void {
  if (!config || typeof config !== 'object') {
    errors.push({
      code: 'INVALID_COOLDOWN_CONFIG',
      message: 'cooldownConfig must be an object',
      path,
      value: config,
    });
    return;
  }
  const c = config as Record<string, unknown>;
  if (c.enabled !== undefined && typeof c.enabled !== 'boolean') {
    errors.push({
      code: 'INVALID_COOLDOWN_ENABLED',
      message: 'enabled must be a boolean',
      path: `${path}.enabled`,
      value: c.enabled,
    });
  }
  if (
    c.defaultCooldownMs !== undefined &&
    (typeof c.defaultCooldownMs !== 'number' || c.defaultCooldownMs < 0)
  ) {
    errors.push({
      code: 'INVALID_DEFAULT_COOLDOWN',
      message: 'defaultCooldownMs must be a non-negative number',
      path: `${path}.defaultCooldownMs`,
      value: c.defaultCooldownMs,
    });
  }
  validateCooldownLimits(c, errors, path);
}
function validateCooldownLimits(
  c: Record<string, unknown>,
  errors: ConfigValidationError[],
  path: string,
) {
  if (
    c.maxCooldownMs !== undefined &&
    (typeof c.maxCooldownMs !== 'number' || c.maxCooldownMs < 0)
  ) {
    errors.push({
      code: 'INVALID_MAX_COOLDOWN',
      message: 'maxCooldownMs must be a non-negative number',
      path: `${path}.maxCooldownMs`,
      value: c.maxCooldownMs,
    });
  }
  if (
    c.backoffMultiplier !== undefined &&
    (typeof c.backoffMultiplier !== 'number' || c.backoffMultiplier < 1)
  ) {
    errors.push({
      code: 'INVALID_BACKOFF_MULTIPLIER',
      message: 'backoffMultiplier must be >= 1',
      path: `${path}.backoffMultiplier`,
      value: c.backoffMultiplier,
    });
  }
  if (c.resetOnSuccess !== undefined && typeof c.resetOnSuccess !== 'boolean') {
    errors.push({
      code: 'INVALID_RESET_ON_SUCCESS',
      message: 'resetOnSuccess must be a boolean',
      path: `${path}.resetOnSuccess`,
      value: c.resetOnSuccess,
    });
  }
}
