/**
 * QuotaWeave TUI plugin setup.
 *
 * Configuration is loaded once per activation. The four commands share one
 * host-managed dialog implementation.
 */

import { createConfigRoutingEngine, type ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { createCommands, registerCommandLayer } from './commands.js';
import { loadRoutingConfig } from './config.js';
import type { QuotaWeaveHost, QuotaWeaveSession } from './types.js';

/** Injectable setup dependencies for tests. */
export interface SetupDependencies {
  readonly loadConfig: (cwd: string, override?: string) => Promise<ResolvedRoutingConfig | null>;
}

function createSession(config: ResolvedRoutingConfig | null): QuotaWeaveSession | null {
  if (!config) return null;
  return { config, engine: createConfigRoutingEngine(config) };
}

/**
 * Activate the QuotaWeave terminal interface.
 */
export async function setupQuotaWeave(
  host: QuotaWeaveHost,
  dependencies: Partial<SetupDependencies> = {},
): Promise<void> {
  const cwd = host.location?.directory ?? process.cwd();
  const loadConfig = dependencies.loadConfig ?? loadRoutingConfig;
  const config = await loadConfig(cwd, process.env.QUOTAWEAVE_CONFIG_PATH);
  const session = createSession(config);

  if (!session) {
    host.ui.toast.show({
      message: 'QuotaWeave: no routing configuration found',
      variant: 'warning',
    });
  }

  const commands = createCommands({
    host,
    getSession: () => session,
  });
  registerCommandLayer(host, commands);
}
