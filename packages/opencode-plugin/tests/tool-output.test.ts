import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { modelsOutput } from '../src/models-output.js';
import type { QuotaWeavePlugin } from '../src/plugin.js';
import { createQuotaWeavePlugin } from '../src/plugin.js';
import { runSimulation } from '../src/simulation-runner.js';
import { statusOutput } from '../src/status-output.js';

let plugin: QuotaWeavePlugin;
beforeEach(async () => {
  plugin = createQuotaWeavePlugin();
  await plugin.initialize({
    requestId: 'tool-test',
    timestamp: 1,
    sessionId: 'tool-test',
    opencodeSessionId: 'tool-test',
    userConfig: {},
    cwd: fileURLToPath(new URL('.', import.meta.url)),
  });
});
afterEach(() => plugin.shutdown());

it('renders a typed simulation without invoking a model or changing runtime state', () => {
  const core = plugin.getCore();
  const invoke = vi.spyOn(core, 'invokeModel');
  const before = structuredClone(core.getRoutingRuntimeState());
  const result = runSimulation(plugin, { task: 'write a function' });
  expect(result).toMatchObject({ title: 'Routing Simulation', metadata: { permitted: true } });
  expect(result.output).toContain('Selected Model:');
  expect(invoke).not.toHaveBeenCalled();
  expect(core.getRoutingRuntimeState()).toEqual(before);
});
it('reports policy rejection without silently selecting an excluded model', () => {
  const result = runSimulation(plugin, {
    task: 'write a function',
    requiredCapabilities: ['not-supported'],
  });
  expect(result).toMatchObject({ metadata: { permitted: false } });
  expect(result.output).toContain('All candidates excluded by policy');
});
it('validates external simulation arguments and handles absent configuration', () => {
  expect(runSimulation(plugin, { task: 42 })).toMatchObject({ title: 'Routing Simulation Error' });
  const uninitialized = createQuotaWeavePlugin();
  expect(runSimulation(uninitialized, { task: 'test' })).toMatchObject({
    metadata: { error: 'No configuration' },
  });
  uninitialized.shutdown();
});
it('shows actual loaded status and configured models through shared renderers', () => {
  expect(statusOutput(plugin)).toMatchObject({
    metadata: { initialized: true, configLoaded: true },
  });
  expect(modelsOutput(plugin).output).toContain('test/model-1');
});
