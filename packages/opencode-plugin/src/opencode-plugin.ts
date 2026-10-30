import { createModelsTool } from './models-tool.js';
import { createSimulationTool } from './simulation-tool.js';
import { createStatusTool } from './status-tool.js';
/**
 * QuotaWeave OpenCode Plugin Entry Point
 *
 * This is the main entry point for the OpenCode 2 plugin.
 * It follows the OpenCode plugin API: a function that returns hooks including tool definitions.
 */

import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import { createQuotaWeavePlugin } from './plugin.js';
import type { PluginContext } from './types.js';

// Use Zod from the tool function to ensure version compatibility with @opencode-ai/plugin

/**
 * Create the QuotaWeave OpenCode plugin
 */
export const createQuotaWeaveOpenCodePlugin: Plugin = async (input: PluginInput) => {
  const { project, directory } = input;

  // Create plugin context for initialization
  const pluginContext: PluginContext = {
    requestId: `init-${Date.now()}`,
    timestamp: Date.now(),
    sessionId: project.id,
    opencodeSessionId: project.id,
    cwd: directory,
    userConfig: {},
  };

  // Create and initialize the QuotaWeave plugin
  const quotaWeavePlugin = createQuotaWeavePlugin();
  await quotaWeavePlugin.initialize(pluginContext);

  // Define the /route status tool
  const routeStatusTool = createStatusTool({ quotaWeavePlugin });

  // Define the /route models tool
  const routeModelsTool = createModelsTool({ quotaWeavePlugin });

  // Define the /route simulate tool
  const routeSimulateTool = createSimulationTool({ quotaWeavePlugin });

  // Return hooks with tool definitions
  const hooks = {
    dispose: async () => {
      quotaWeavePlugin.shutdown();

      return Promise.resolve();
    },
    tool: {
      'route.status': routeStatusTool,
      'route.models': routeModelsTool,
      'route.simulate': routeSimulateTool,
    },
  };

  return hooks;
};

/**
 * Plugin module export for OpenCode
 * The plugin system expects a default export that is an object with id and effect function
 */
export default {
  id: 'quotaweave',
  effect: createQuotaWeaveOpenCodePlugin,
} as const;
