/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ResolvedRoutingConfig, RoutingCategoryConfig } from './config.js';
export function inferCategoryFromTask({
  resolvedConfig,
  task,
}: InferCategoryFromTaskArgs): RoutingCategoryConfig | null {
  const lowerTask = task.toLowerCase();
  // Check for coding-related keywords
  if (
    /coding|program|develop|implement|debug|refactor|api|function|class|module|test|script/.test(
      lowerTask,
    )
  ) {
    const cat = resolvedConfig.categories.find((c) => c.id === 'coding' && c.enabled);
    if (cat) return cat;
  }
  // Check for reasoning-related keywords
  if (/reason|analy|complex|logic|proof|math|algorithm|architecture|design/.test(lowerTask)) {
    const cat = resolvedConfig.categories.find((c) => c.id === 'reasoning' && c.enabled);
    if (cat) return cat;
  }
  // Check for speed-related keywords
  if (/fast|quick|speed|latency|respond|immediate/.test(lowerTask)) {
    const cat = resolvedConfig.categories.find((c) => c.id === 'quick' && c.enabled);
    if (cat) return cat;
  }
  // Note: free-only is a cost policy (costPolicy.freeOnly), not a category
  // If user wants free-only, they should enable costPolicy.freeOnly in config
  // Default to general
  const general = resolvedConfig.categories.find((c) => c.id === 'general' && c.enabled);
  return general ?? null;
}
type InferCategoryFromTaskArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  task: string;
};
