/** Native V2 plugin entry point. Shared handlers keep registration small and typed. */
import type { Context } from '@opencode/plugin/promise/plugin';
import { define } from '@opencode/plugin/promise/plugin';
import { z } from 'zod';
import { modelsOutput } from './models-output.js';
import type { QuotaWeavePlugin } from './plugin.js';
import { createQuotaWeavePlugin } from './plugin.js';
import { runSimulation } from './simulation-runner.js';
import { statusOutput } from './status-output.js';
import { simulationShape } from './tool-input.js';
import type { PluginContext } from './types.js';

type ToolEditor = Parameters<Parameters<NonNullable<Context['tool']>['transform']>[0]>[0];
const optionsSchema = z.object({
  projectId: z.string().optional(),
  pluginOptions: z.record(z.string(), z.unknown()).optional(),
});

function registerTools(editor: ToolEditor, plugin: QuotaWeavePlugin): void {
  editor.update('route_status', (entry) => {
    entry.description = 'Show QuotaWeave routing status and configuration';
    entry.input = z.object({});
    entry.execute = () => Promise.resolve(statusOutput(plugin));
  });
  editor.update('route_models', (entry) => {
    entry.description = 'List explicitly configured models';
    entry.input = z.object({});
    entry.execute = () => Promise.resolve(modelsOutput(plugin));
  });
  editor.update('route_simulate', (entry) => {
    entry.description = 'Simulate routing without making LLM calls or switching models';
    entry.input = z.object(simulationShape);
    entry.execute = (input) => Promise.resolve(runSimulation(plugin, input));
  });
}

export default define({
  id: 'opencode-quotaweave',
  async setup(ctx: Context): Promise<void> {
    const options = optionsSchema.parse(ctx.options);
    const context: PluginContext = {
      requestId: `init-${Date.now()}`,
      timestamp: Date.now(),
      sessionId: options.projectId ?? 'unknown',
      opencodeSessionId: options.projectId ?? 'unknown',
      cwd: z.string().parse(ctx.location.directory ?? process.cwd()),
      userConfig: options.pluginOptions ?? {},
    };
    const plugin = createQuotaWeavePlugin();
    await plugin.initialize(context);
    const transform = ctx.tool?.transform;
    if (transform) await transform((editor) => registerTools(editor, plugin));
  },
});
