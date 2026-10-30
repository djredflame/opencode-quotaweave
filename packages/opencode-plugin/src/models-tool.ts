/** Native model listing tool; rendering is shared with the V2 adapter. */
import { tool } from '@opencode-ai/plugin';
import { modelsOutput } from './models-output.js';
import type { QuotaWeavePlugin } from './plugin.js';
export function createModelsTool({ quotaWeavePlugin }: CreateModelsToolArgs) {
  return tool({
    description: 'List explicitly configured models',
    args: {},
    execute: () => Promise.resolve(modelsOutput(quotaWeavePlugin)),
  });
}

type CreateModelsToolArgs = { quotaWeavePlugin: QuotaWeavePlugin };
