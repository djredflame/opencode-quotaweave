/** Render the typed simulation result without unsafe shape assertions. */
import type { SimulationResult } from '@opencode-quotaweave/core';
export function simulationOutput(simResult: SimulationResult, args: { task: string }) {
  const lines = ['=== Routing Simulation ===', ''];
  lines.push(`Task: ${args.task}`);
  lines.push(
    `Category: ${simResult.category} ${simResult.metadata.heuristicCategory ? '(heuristic)' : '(explicit)'}`,
  );
  lines.push(`Strategy: ${simResult.metadata.strategy}`);
  lines.push(`Cost Policy: ${simResult.costPolicy.freeOnly ? '🔒 Free-Only' : '💰 Paid Allowed'}`);
  lines.push(`Permitted: ${simResult.permitted ? '✅ Yes' : '❌ No'}`);
  lines.push('');
  appendSelectedModel(simResult, lines);
  appendSimulationCandidates(lines, simResult);
  lines.push('');
  lines.push(
    'Note: This is a pure simulation. No LLM calls were made, no model was switched, and no configuration was modified.',
  );
  return {
    title: 'Routing Simulation',
    output: lines.join('\n'),
    metadata: {
      category: simResult.category,
      heuristicCategory: simResult.metadata.heuristicCategory,
      permitted: simResult.permitted,
      selectedModel: simResult.selectedModel?.model.id,
      rejectionReason: simResult.rejectionReason,
      candidateCount: simResult.candidates.length,
      decisionTimeMs: simResult.metadata.decisionTimeMs,
    },
  };
}

function appendSelectedModel(simResult: SimulationResult, lines: string[]) {
  if (simResult.selectedModel) {
    const m = simResult.selectedModel.model;
    lines.push(`Selected Model: ${m.id} (${m.provider})`);
    lines.push(`  Capabilities: ${m.capabilities.join(', ')}`);
    lines.push(`  Cost: ${m.costClassification} ($${m.estimatedCostPer1kTokens ?? 'N/A'}/1k)`);
    lines.push(`  Latency: ~${m.estimatedLatencyMs ?? 'N/A'}ms`);
    lines.push('');
  } else {
    lines.push(`Rejection Reason: ${simResult.rejectionReason}`);
    lines.push('');
  }
}

function appendSimulationCandidates(lines: string[], simResult: SimulationResult) {
  lines.push('All Candidates:');
  for (const candidate of simResult.candidates) {
    const m = candidate.model;
    const status = candidate.excluded ? '❌ Excluded' : '✅ Considered';
    const score = candidate.scoreBreakdown.totalScore.toFixed(3);
    lines.push(`  ${status} ${m.id} (score: ${score})`);
    if (candidate.excluded && candidate.exclusionReasons.length > 0) {
      for (const reason of candidate.exclusionReasons) {
        lines.push(`    Reason: ${reason}`);
      }
    }
  }
  lines.push('');
  lines.push('Active Cooldowns:');
  if (simResult.activeCooldowns.length === 0) {
    lines.push('  None');
  } else {
    for (const cd of simResult.activeCooldowns) {
      const remaining = Math.round(cd.remainingMs / 1000);
      lines.push(`  ${cd.modelId} (${cd.provider}): ${remaining}s remaining - ${cd.reason}`);
    }
  }
}
