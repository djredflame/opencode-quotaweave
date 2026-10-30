/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError, type ConfigValidationWarning } from './config.js';
export function validateShadowMode(
  config: unknown,
  errors: ConfigValidationError[],
  _warnings: ConfigValidationWarning[],
  path: string,
): void {
  if (!config || typeof config !== 'object') {
    errors.push({
      code: 'INVALID_SHADOW_MODE',
      message: 'shadowMode must be an object',
      path,
      value: config,
    });
    return;
  }
  const s = config as Record<string, unknown>;
  if (s.enabled !== undefined && typeof s.enabled !== 'boolean') {
    errors.push({
      code: 'INVALID_SHADOW_ENABLED',
      message: 'enabled must be a boolean',
      path: `${path}.enabled`,
      value: s.enabled,
    });
  }
  if (s.shadowModelIds !== undefined) {
    if (!Array.isArray(s.shadowModelIds)) {
      errors.push({
        code: 'INVALID_SHADOW_MODELS',
        message: 'shadowModelIds must be an array',
        path: `${path}.shadowModelIds`,
        value: s.shadowModelIds,
      });
    }
  }
  validateShadowLogging(s, errors, path);
}
function validateShadowLogging(
  s: Record<string, unknown>,
  errors: ConfigValidationError[],
  path: string,
) {
  if (s.logDecisions !== undefined && typeof s.logDecisions !== 'boolean') {
    errors.push({
      code: 'INVALID_LOG_DECISIONS',
      message: 'logDecisions must be a boolean',
      path: `${path}.logDecisions`,
      value: s.logDecisions,
    });
  }
  if (
    s.sampleRate !== undefined &&
    (typeof s.sampleRate !== 'number' || s.sampleRate < 0 || s.sampleRate > 1)
  ) {
    errors.push({
      code: 'INVALID_SAMPLE_RATE',
      message: 'sampleRate must be between 0 and 1',
      path: `${path}.sampleRate`,
      value: s.sampleRate,
    });
  }
}
