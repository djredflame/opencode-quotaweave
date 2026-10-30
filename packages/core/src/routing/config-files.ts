/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import type { ConfigFileAccess } from '../types.js';
import { ConfigLoadError, ConfigValidationException } from './config-errors.js';
import { validateGlobalConfig } from './config-validate-global-config.js';
import { validateProjectConfig } from './config-validate-project-config.js';
import {
  type GlobalRoutingConfig,
  type ProjectRoutingConfig,
  type RoutingConfig,
} from './config.js';
export async function loadConfigFile(filePath: string, access: ConfigFileAccess): Promise<unknown> {
  const content = await access.readText(filePath);
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new ConfigLoadError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
    );
  }
}
export async function loadGlobalConfig(
  filePath: string,
  access: ConfigFileAccess,
): Promise<GlobalRoutingConfig> {
  const raw = await loadConfigFile(filePath, access);
  const result = validateGlobalConfig(raw);
  if (!result.valid) {
    const messages = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new ConfigValidationException(
      `Global config validation failed: ${messages}`,
      result.errors,
    );
  }
  return raw as GlobalRoutingConfig;
}
export async function loadProjectConfig(
  filePath: string,
  globalConfig: GlobalRoutingConfig,
  access: ConfigFileAccess,
): Promise<ProjectRoutingConfig> {
  const raw = await loadConfigFile(filePath, access);
  const result = validateProjectConfig(raw, globalConfig);
  if (!result.valid) {
    const messages = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new ConfigValidationException(
      `Project config validation failed: ${messages}`,
      result.errors,
    );
  }
  return raw as ProjectRoutingConfig;
}
export async function findAndLoadConfig(
  projectRoot: string,
  globalConfigPath: string | undefined,
  access: ConfigFileAccess,
): Promise<RoutingConfig> {
  // Load global config
  const globalPath = globalConfigPath || access.join(projectRoot, 'router.json');
  const global = await loadGlobalConfig(globalPath, access);
  // Try to find project config
  const projectPath = access.join(projectRoot, 'router.project.json');
  const project = (await access.exists(projectPath))
    ? await loadProjectConfig(projectPath, global, access)
    : undefined;
  if (project) {
    return { global, project };
  }
  return { global };
}
