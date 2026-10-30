/** Public configuration API. Validation and loading live in focused internal modules. */
export { createDefaultGlobalConfig, createDefaultProjectConfig } from './config-defaults.js';
export { ConfigLoadError, ConfigValidationException } from './config-errors.js';
export {
  findAndLoadConfig,
  loadConfigFile,
  loadGlobalConfig,
  loadProjectConfig,
} from './config-files.js';
export { resolveConfig } from './config-resolve-config.js';
export { validateGlobalConfig } from './config-validate-global-config.js';
export { validateProjectConfig } from './config-validate-project-config.js';
export { CONFIG_SCHEMA_VERSION } from './config.js';
