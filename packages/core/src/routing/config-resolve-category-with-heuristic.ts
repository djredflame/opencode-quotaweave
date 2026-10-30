/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { inferCategoryFromTask } from './config-infer-category-from-task.js';
import type { ResolvedRoutingConfig, RoutingCategoryConfig } from './config.js';
export function resolveCategoryWithHeuristic({
  resolvedConfig,
  categoryId,
  taskDescription,
}: ResolveCategoryWithHeuristicArgs): {
  category: RoutingCategoryConfig | null;
  heuristicCategory: boolean;
} {
  if (categoryId) {
    const category = resolvedConfig.categories.find((c) => c.id === categoryId);
    return { category: category && category.enabled ? category : null, heuristicCategory: false };
  }
  // Heuristic: try to infer from task description
  if (taskDescription) {
    const heuristic = inferCategoryFromTask({
      resolvedConfig: resolvedConfig,
      task: taskDescription,
    });
    if (heuristic) {
      return { category: heuristic, heuristicCategory: true };
    }
  }
  // Fall back to default
  const defaultCat = resolvedConfig.categories.find((c) => c.id === resolvedConfig.defaultCategory);
  return {
    category: defaultCat && defaultCat.enabled ? defaultCat : null,
    heuristicCategory: false,
  };
}
type ResolveCategoryWithHeuristicArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  categoryId?: string | undefined;
  taskDescription?: string | undefined;
};
