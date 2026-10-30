/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ResolvedRoutingConfig, RoutingCategoryConfig } from './config.js';
export function resolveCategory({
  resolvedConfig,
  categoryId,
}: ResolveCategoryArgs): RoutingCategoryConfig | null {
  const targetId = categoryId ?? resolvedConfig.defaultCategory;
  const category = resolvedConfig.categories.find((c) => c.id === targetId);
  // If explicit category provided but not found/disabled, return null (will be rejected)
  if (categoryId && (!category || !category.enabled)) {
    return null;
  }
  // If no explicit category and default is disabled, fall back to first enabled category
  if (!categoryId && (!category || !category.enabled)) {
    const fallback = resolvedConfig.categories.find((c) => c.enabled);
    if (fallback) {
      return fallback;
    }
  }
  return category && category.enabled ? category : null;
}
type ResolveCategoryArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  categoryId?: string | undefined;
};
