/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { DEFAULT_STRATEGY_WEIGHTS } from './config-defaults.js';
import { type ConfigValidationError, type RoutingStrategyType } from './config.js';
export function validateStrategyWeights(
  weights: unknown,
  errors: ConfigValidationError[],
  path: string,
): boolean {
  if (!weights || typeof weights !== 'object') {
    errors.push({
      code: 'INVALID_STRATEGY_WEIGHTS',
      message: 'strategyWeights must be an object',
      path,
      value: weights,
    });
    return false;
  }
  const w = weights as Record<string, unknown>;
  let valid = true;
  for (const strategy of Object.keys(DEFAULT_STRATEGY_WEIGHTS) as RoutingStrategyType[]) {
    const value = w[strategy];
    if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
      errors.push({
        code: 'INVALID_STRATEGY_WEIGHT',
        message: `Weight for ${strategy} must be a number between 0 and 1`,
        path: `${path}.${strategy}`,
        value,
      });
      valid = false;
    }
  }
  return valid;
}
