import { runSimulation } from './simulation-runner.js';
/** Simulation execution shared by the native adapters. */
import type { ToolDefinition } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import type { QuotaWeavePlugin } from './plugin.js';

export function createSimulationTool({
  quotaWeavePlugin,
}: CreateSimulationToolArgs): ToolDefinition {
  return tool({
    description: 'Simulate routing without making LLM calls or switching models',
    args: {
      task: tool.schema.string().describe('Task description for routing'),
      category: tool.schema.string().optional(),
      requiredCapabilities: tool.schema.array(tool.schema.string()).optional(),
      preferredProviders: tool.schema.array(tool.schema.string()).optional(),
      excludedProviders: tool.schema.array(tool.schema.string()).optional(),
      maxCost: tool.schema.number().optional(),
      maxLatencyMs: tool.schema.number().optional(),
    },
    execute: (input: unknown) => Promise.resolve(runSimulation(quotaWeavePlugin, input)),
  });
}

type CreateSimulationToolArgs = { quotaWeavePlugin: QuotaWeavePlugin };
