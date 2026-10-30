/** Shared configured-model output for native OpenCode adapters. */
import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import type { QuotaWeavePlugin } from './plugin.js';
export function modelsOutput(quotaWeavePlugin: QuotaWeavePlugin) {
  const routingConfig = quotaWeavePlugin.getRoutingConfig();

  if (!routingConfig || routingConfig.models.length === 0) {
    return {
      title: 'QuotaWeave Models',
      output: 'No models configured. Add models to your router.json to enable routing.',
      metadata: { modelCount: 0 },
    };
  }

  const lines = ['=== QuotaWeave Configured Models ===', ''];

  appendConfiguredModels(routingConfig, lines);

  lines.push('---');
  lines.push(`Total: ${routingConfig.models.length} models`);
  lines.push(`Enabled: ${routingConfig.models.filter((m) => m.enabled).length}`);

  return {
    title: 'QuotaWeave Models',
    output: lines.join('\n'),
    metadata: {
      modelCount: routingConfig.models.length,
      enabledCount: routingConfig.models.filter((m) => m.enabled).length,
    },
  };
}

function appendConfiguredModels(routingConfig: ResolvedRoutingConfig, lines: string[]) {
  for (const model of routingConfig.models) {
    const status = model.enabled ? '✅ Enabled' : '❌ Disabled';
    const costIcon =
      model.costClassification === 'free'
        ? '🆓'
        : model.costClassification === 'paid'
          ? '💰'
          : '❓';
    const categories =
      routingConfig.categories
        .filter((c) => c.enabled && c.modelIds.includes(model.id))
        .map((c) => c.id)
        .join(', ') || 'none';

    lines.push(`${model.id} ${status}`);
    lines.push(`  Provider: ${model.provider}`);
    lines.push(`  Display Name: ${model.displayName ?? model.id}`);
    lines.push(
      `  Cost: ${costIcon} ${model.costClassification} (${model.estimatedCostPer1kTokens ?? 'N/A'}/1k tokens)`,
    );
    lines.push(`  Latency: ~${model.estimatedLatencyMs ?? 'N/A'}ms`);
    lines.push(`  Priority: ${model.priority}`);
    lines.push(`  Capabilities: ${model.capabilities.join(', ')}`);
    lines.push(`  Categories: ${categories}`);
    lines.push(`  Fallbacks: ${model.fallbacks?.join(', ') ?? 'none'}`);
    lines.push('');
  }
}
