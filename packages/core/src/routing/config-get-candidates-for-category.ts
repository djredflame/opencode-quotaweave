/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ModelConfig, ResolvedRoutingConfig, RoutingCategoryConfig } from './config.js';
export function getCandidatesForCategory({
  resolvedConfig,
  category,
}: GetCandidatesForCategoryArgs): ModelConfig[] {
  const modelIdSet = new Set(category.modelIds);
  return resolvedConfig.models
    .filter((m) => modelIdSet.has(m.id))
    .sort((a, b) => b.priority - a.priority);
}
type GetCandidatesForCategoryArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  category: RoutingCategoryConfig;
};
