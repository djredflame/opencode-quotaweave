import { expect, it } from 'vitest';
import { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import { resolveConfig } from '../src/routing/config-loader.js';
import { GLOBAL_CONFIG_FIXTURE } from './config-fixtures.js';
import { requiredItem } from './required-item.js';

it('refuses missing categories and empty candidate pools explicitly', () => {
  const config = resolveConfig(structuredClone(GLOBAL_CONFIG_FIXTURE));
  const engine = new ConfigRoutingEngine(config);
  expect(engine.simulate({ task: 'test', category: 'not-configured' })).toMatchObject({
    permitted: false,
    selectedModel: null,
  });
  config.categories = [{ ...requiredItem(config.categories, 0), modelIds: [] }];
  expect(engine.simulate({ task: 'test', category: 'general' }).rejectionReason).toContain(
    'No models available',
  );
});
it.each(['reason about architecture', 'quick response', 'ordinary conversation'])(
  'infers supported categories for %s',
  (task) => {
    const config = resolveConfig(structuredClone(GLOBAL_CONFIG_FIXTURE));
    const engine = new ConfigRoutingEngine(config);
    const result = engine.simulate({ task });
    expect(result.category).toBeDefined();
    expect(result.metadata.heuristicCategory).toBe(true);
  },
);
it('reports provider, latency, cost and capability exclusions during simulation', () => {
  const config = resolveConfig(structuredClone(GLOBAL_CONFIG_FIXTURE));
  const engine = new ConfigRoutingEngine(config);
  const result = engine.simulate({
    task: 'test',
    category: 'general',
    preferredProviders: ['absent'],
    excludedProviders: ['test'],
    maxCost: -1,
    maxLatencyMs: 0,
    requiredCapabilities: ['absent'],
  });
  expect(result.permitted).toBe(false);
  expect(result.candidates.every((candidate) => candidate.excluded)).toBe(true);
  expect(
    result.candidates.some((candidate) =>
      candidate.exclusionReasons.some((reason) => reason.includes('latency')),
    ),
  ).toBe(true);
});
