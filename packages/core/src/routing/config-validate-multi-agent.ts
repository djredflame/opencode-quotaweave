/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError, type ConfigValidationWarning } from './config.js';
export function validateMultiAgent(
  config: unknown,
  errors: ConfigValidationError[],
  _warnings: ConfigValidationWarning[],
  path: string,
): void {
  if (!config || typeof config !== 'object') {
    errors.push({
      code: 'INVALID_MULTI_AGENT',
      message: 'multiAgent must be an object',
      path,
      value: config,
    });
    return;
  }
  const m = config as Record<string, unknown>;
  if (m.mode !== undefined && !['off', 'manual', 'auto'].includes(m.mode as string)) {
    errors.push({
      code: 'INVALID_MULTI_AGENT_MODE',
      message: 'mode must be "off", "manual", or "auto"',
      path: `${path}.mode`,
      value: m.mode,
    });
  }
  const boolFields = [
    'requirePreview',
    'stopOnModelFailure',
    'noParallelFsWrites',
    'enforceAllowlists',
    'previewNoQuotaConsumption',
    'enforceGuards',
  ];
  for (const field of boolFields) {
    if (m[field] !== undefined && typeof m[field] !== 'boolean') {
      errors.push({
        code: 'INVALID_MULTI_AGENT_BOOL',
        message: `${field} must be a boolean`,
        path: `${path}.${field}`,
        value: m[field],
      });
    }
  }
}
