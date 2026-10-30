/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { type ConfigValidationError } from './config.js';
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}
export class ConfigValidationException extends Error {
  constructor(
    message: string,
    public readonly errors: ConfigValidationError[],
  ) {
    super(message);
    this.name = 'ConfigValidationException';
  }
}
