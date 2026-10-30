/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { RoutingRuntimeState } from './config.js';
export function getEmptyRuntimeState(): RoutingRuntimeState {
  return {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };
}
