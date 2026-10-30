/** Shared status output for native OpenCode adapters. */
import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import type { QuotaWeavePlugin } from './plugin.js';
export function statusOutput(plugin: QuotaWeavePlugin) {
  const isInitialized = plugin.isInitialized(),
    routingConfig = plugin.getRoutingConfig();
  if (!isInitialized || !routingConfig)
    return {
      title: 'QuotaWeave Status',
      output: 'QuotaWeave plugin is loaded but not initialized. No routing configuration found.',
      metadata: { initialized: false, configLoaded: false },
    };
  const modelCount = routingConfig.models.length;
  const enabledModels = routingConfig.models.filter((m) => m.enabled).length;
  const categories = routingConfig.categories.filter((c) => c.enabled).length;
  const costPolicy = routingConfig.costPolicy;
  const currentModel = 'Unknown';
  return {
    title: 'QuotaWeave Status',
    output: statusLines(routingConfig, isInitialized, currentModel).join('\n'),
    metadata: {
      initialized: isInitialized,
      configLoaded: true,
      modelCount,
      enabledModels,
      categories,
      costPolicy: {
        freeOnly: costPolicy.freeOnly,
        maxCostPerRequest: costPolicy.maxCostPerRequest,
        maxCostPerSession: costPolicy.maxCostPerSession,
      },
      currentModel,
    },
  };
}
function statusLines(
  routingConfig: ResolvedRoutingConfig,
  isInitialized: boolean,
  currentModel: string,
) {
  const modelCount = routingConfig.models.length;
  const enabledModels = routingConfig.models.filter((m) => m.enabled).length;
  const categories = routingConfig.categories.filter((c) => c.enabled).length;
  const costPolicy = routingConfig.costPolicy;
  return [
    '=== QuotaWeave Status ===',
    '',
    `Initialized: ${isInitialized ? '✅ Yes' : '❌ No'}`,
    `Configuration: ${routingConfig.models.length > 0 ? '✅ Loaded' : '❌ Empty'}`,
    `Models Configured: ${modelCount} (${enabledModels} enabled)`,
    `Categories: ${categories} enabled`,
    `Cost Policy: ${costPolicy.freeOnly ? '🔒 Free-Only' : '💰 Paid Allowed'}`,
    `  Max Cost/Request: $${costPolicy.maxCostPerRequest?.toFixed(4) ?? 'N/A'}`,
    `  Max Cost/Session: $${costPolicy.maxCostPerSession?.toFixed(2) ?? 'N/A'}`,
    `  Warn Threshold: ${(costPolicy.warnThreshold ?? 0.8) * 100}%`,
    `  Budget Period: ${costPolicy.budgetPeriodHours ?? 24}h`,
    `Cooldown: ${routingConfig.cooldownConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`,
    `  Default: ${routingConfig.cooldownConfig.defaultCooldownMs}ms`,
    `  Max: ${routingConfig.cooldownConfig.maxCooldownMs}ms`,
    `Shadow Mode: ${routingConfig.shadowMode.enabled ? '✅ Enabled' : '❌ Disabled'}`,
    '',
    `Current Model: ${currentModel}`,
    '',
    'Integration Limitations:',
    '  • Background requests (title generation, compaction) may bypass QuotaWeave',
    '  • Subagent delegation not yet implemented (ADR-002)',
    '  • Direct provider HTTP calls not intercepted',
    '',
    'Commands:',
    '  /route status   - Show this status',
    '  /route models   - List configured models',
    '  /route simulate - Simulate routing decision',
  ];
}
