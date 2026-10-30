/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { CooldownInfo, ModelConfig, RoutingRuntimeState } from './config.js';
export function getActiveCooldowns({
  runtimeState,
  models,
}: GetActiveCooldownsArgs): CooldownInfo[] {
  const now = Date.now();
  const cooldowns: CooldownInfo[] = [];
  for (const model of models) {
    const key = `${model.provider}:${model.id}`;
    const state = runtimeState.cooldowns[key];
    if (state && state.expiresAt > now) {
      cooldowns.push({
        modelId: model.id,
        provider: model.provider,
        expiresAt: state.expiresAt,
        remainingMs: state.expiresAt - now,
        reason: state.lastFailureReason ?? 'Previous failure',
      });
    }
  }
  return cooldowns;
}
type GetActiveCooldownsArgs = {
  runtimeState: RoutingRuntimeState;
  models: ModelConfig[];
};
