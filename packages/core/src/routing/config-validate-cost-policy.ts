/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError, type ConfigValidationWarning } from './config.js';
export function validateCostPolicy({
  policy,
  errors,
  path,
  isProjectOverride = false,
}: ValidateCostPolicyArgs): void {
  if (!policy || typeof policy !== 'object') {
    errors.push({
      code: 'INVALID_COST_POLICY',
      message: 'costPolicy must be an object',
      path,
      value: policy,
    });
    return;
  }
  const p = policy as Record<string, unknown>;
  if (p.freeOnly !== undefined && typeof p.freeOnly !== 'boolean') {
    errors.push({
      code: 'INVALID_FREE_ONLY',
      message: 'freeOnly must be a boolean',
      path: `${path}.freeOnly`,
      value: p.freeOnly,
    });
  }
  if (
    p.maxCostPerRequest !== undefined &&
    (typeof p.maxCostPerRequest !== 'number' || p.maxCostPerRequest < 0)
  ) {
    errors.push({
      code: 'INVALID_MAX_COST',
      message: 'maxCostPerRequest must be a non-negative number',
      path: `${path}.maxCostPerRequest`,
      value: p.maxCostPerRequest,
    });
  }
  if (
    p.maxCostPerSession !== undefined &&
    (typeof p.maxCostPerSession !== 'number' || p.maxCostPerSession < 0)
  ) {
    errors.push({
      code: 'INVALID_MAX_SESSION_COST',
      message: 'maxCostPerSession must be a non-negative number',
      path: `${path}.maxCostPerSession`,
      value: p.maxCostPerSession,
    });
  }
  validateBudgetWindow(p, errors, path);
  // Project overrides can only be more restrictive
  if (isProjectOverride) {
    // This is enforced at the application level when merging
  }
}
function validateBudgetWindow(
  p: Record<string, unknown>,
  errors: ConfigValidationError[],
  path: string,
) {
  if (
    p.warnThreshold !== undefined &&
    (typeof p.warnThreshold !== 'number' || p.warnThreshold < 0 || p.warnThreshold > 1)
  ) {
    errors.push({
      code: 'INVALID_WARN_THRESHOLD',
      message: 'warnThreshold must be between 0 and 1',
      path: `${path}.warnThreshold`,
      value: p.warnThreshold,
    });
  }
  if (
    p.budgetPeriodHours !== undefined &&
    (typeof p.budgetPeriodHours !== 'number' || p.budgetPeriodHours < 1)
  ) {
    errors.push({
      code: 'INVALID_BUDGET_PERIOD',
      message: 'budgetPeriodHours must be a positive number',
      path: `${path}.budgetPeriodHours`,
      value: p.budgetPeriodHours,
    });
  }
}
type ValidateCostPolicyArgs = {
  policy: unknown;
  errors: ConfigValidationError[];
  _warnings: ConfigValidationWarning[];
  path: string;
  isProjectOverride?: boolean | undefined;
};
