import { configFileAccess } from '../config-file-access.js';
/**
 * Routing configuration loading for the QuotaWeave TUI.
 *
 * The core package owns parsing and validation. This module only resolves the
 * project-local configuration locations and returns the effective config.
 */

import {
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';

function configCandidates(cwd: string, override: string | undefined): string[] {
  if (override) {
    return [path.resolve(cwd, override)];
  }
  return [path.join(cwd, 'router.json'), path.join(cwd, 'dev.route.json')];
}

/**
 * Load the first readable routing configuration.
 *
 * Returns null instead of throwing so the TUI can still explain that no
 * configuration was found.
 */
export async function loadRoutingConfig(
  cwd: string,
  override?: string,
): Promise<ResolvedRoutingConfig | null> {
  for (const candidate of configCandidates(cwd, override)) {
    try {
      const routingConfig = await findAndLoadConfig(cwd, candidate, configFileAccess);
      return resolveConfig(routingConfig.global, routingConfig.project);
    } catch {
      continue;
    }
  }
  return null;
}
