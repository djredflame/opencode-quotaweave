/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError, type ConfigValidationWarning } from './config.js';
export function validateModels(
  models: unknown[],
  errors: ConfigValidationError[],
  _warnings: ConfigValidationWarning[],
  pathPrefix = 'models',
): void {
  const seenIds = new Set<string>();
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const modelPath = `${pathPrefix}[${i}]`;
    if (!model || typeof model !== 'object') {
      errors.push({
        code: 'INVALID_MODEL',
        message: 'Model must be an object',
        path: modelPath,
        value: model,
      });
      continue;
    }
    const m = model as Record<string, unknown>;
    // Required fields
    validateModelIdentity(m, errors, modelPath, seenIds);
    validateModelPolicyFields(m, errors, modelPath);
    // Optional fields validation
    validateModelOptions(m, errors, modelPath);
  }
}
function validateModelIdentity(
  m: Record<string, unknown>,
  errors: ConfigValidationError[],
  modelPath: string,
  seenIds: Set<string>,
) {
  if (typeof m.id !== 'string' || !m.id) {
    errors.push({
      code: 'MISSING_MODEL_ID',
      message: 'Model id is required',
      path: `${modelPath}.id`,
      value: m.id,
    });
  } else if (seenIds.has(m.id)) {
    errors.push({
      code: 'DUPLICATE_MODEL_ID',
      message: `Duplicate model id: ${m.id}`,
      path: `${modelPath}.id`,
      value: m.id,
    });
  } else {
    seenIds.add(m.id);
  }
  if (typeof m.provider !== 'string' || !m.provider) {
    errors.push({
      code: 'MISSING_PROVIDER',
      message: 'Model provider is required',
      path: `${modelPath}.provider`,
      value: m.provider,
    });
  }
  if (!Array.isArray(m.capabilities) || m.capabilities.length === 0) {
    errors.push({
      code: 'MISSING_CAPABILITIES',
      message: 'Model must have at least one capability',
      path: `${modelPath}.capabilities`,
      value: m.capabilities,
    });
  }
}
function validateModelPolicyFields(
  m: Record<string, unknown>,
  errors: ConfigValidationError[],
  modelPath: string,
) {
  if (typeof m.priority !== 'number' || m.priority < 0 || m.priority > 100) {
    errors.push({
      code: 'INVALID_PRIORITY',
      message: 'Priority must be a number between 0 and 100',
      path: `${modelPath}.priority`,
      value: m.priority,
    });
  }
  if (!['free', 'paid', 'unknown'].includes(m.costClassification as string)) {
    errors.push({
      code: 'INVALID_COST_CLASSIFICATION',
      message: 'costClassification must be "free", "paid", or "unknown"',
      path: `${modelPath}.costClassification`,
      value: m.costClassification,
    });
  }
  if (typeof m.enabled !== 'boolean') {
    errors.push({
      code: 'INVALID_ENABLED',
      message: 'enabled must be a boolean',
      path: `${modelPath}.enabled`,
      value: m.enabled,
    });
  }
}
function validateModelOptions(
  m: Record<string, unknown>,
  errors: ConfigValidationError[],
  modelPath: string,
) {
  if (
    m.estimatedCostPer1kTokens !== undefined &&
    (typeof m.estimatedCostPer1kTokens !== 'number' || m.estimatedCostPer1kTokens < 0)
  ) {
    errors.push({
      code: 'INVALID_COST',
      message: 'estimatedCostPer1kTokens must be a non-negative number',
      path: `${modelPath}.estimatedCostPer1kTokens`,
      value: m.estimatedCostPer1kTokens,
    });
  }
  if (
    m.estimatedLatencyMs !== undefined &&
    (typeof m.estimatedLatencyMs !== 'number' || m.estimatedLatencyMs < 0)
  ) {
    errors.push({
      code: 'INVALID_LATENCY',
      message: 'estimatedLatencyMs must be a non-negative number',
      path: `${modelPath}.estimatedLatencyMs`,
      value: m.estimatedLatencyMs,
    });
  }
  if (m.fallbacks === undefined) return;
  if (!Array.isArray(m.fallbacks)) {
    errors.push({
      code: 'INVALID_FALLBACKS',
      message: 'fallbacks must be an array',
      path: `${modelPath}.fallbacks`,
      value: m.fallbacks,
    });
    return;
  }
  for (let j = 0; j < m.fallbacks.length; j++) {
    if (typeof m.fallbacks[j] !== 'string') {
      errors.push({
        code: 'INVALID_FALLBACK_ID',
        message: 'fallback IDs must be strings',
        path: `${modelPath}.fallbacks[${j}]`,
        value: m.fallbacks[j],
      });
    }
  }
}
