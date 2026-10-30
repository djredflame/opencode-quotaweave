import type { QuotaWeavePlugin } from './plugin.js';
import { simulationOutput } from './simulation-output.js';
import { parseSimulationRequest } from './tool-input.js';

export function runSimulation(plugin: QuotaWeavePlugin, input: unknown) {
  if (!plugin.getRoutingConfig()) {
    return {
      title: 'Routing Simulation',
      output: 'No routing configuration loaded. Cannot simulate.',
      metadata: { error: 'No configuration' },
    };
  }
  try {
    const request = parseSimulationRequest(input);
    const core = plugin.getCore();
    const result = core.getConfigRoutingEngine().simulate(request, core.getRoutingRuntimeState());
    return simulationOutput(result, request);
  } catch (error) {
    return {
      title: 'Routing Simulation Error',
      output: `Simulation failed: ${error instanceof Error ? error.message : String(error)}`,
      metadata: { error: String(error) },
    };
  }
}
