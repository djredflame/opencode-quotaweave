/** Native status tool; rendering is shared with the V2 adapter. */
import { tool } from '@opencode-ai/plugin';
import type { QuotaWeavePlugin } from './plugin.js';
import { statusOutput } from './status-output.js';
export function createStatusTool({ quotaWeavePlugin }: CreateStatusToolArgs) {
  return tool({
    description: 'Show QuotaWeave routing status and configuration',
    args: {},
    execute: () => Promise.resolve(statusOutput(quotaWeavePlugin)),
  });
}

type CreateStatusToolArgs = { quotaWeavePlugin: QuotaWeavePlugin };
