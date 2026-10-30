/**
 * Tests for Weighted routing state, simulation and strategy isolation.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import { createDefaultConfigRoutingEngine } from '../src/routing/config-engine.js';
import type {
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingRuntimeState,
} from '../src/routing/config.js';
import { MODEL_FIXTURES, buildTestResolvedConfig } from './config-fixtures.js';
import {
  WEIGHTED_MODEL_IDS,
  createWeightedConfig,
  createWeightedRequest,
  routeSequence,
} from './weighted-fixtures.js';

const SIMULATION = {
  task: 'Simulate weighted routing',
  category: 'coding',
  requiredCapabilities: ['coding'],
};

let engine: ConfigRoutingEngine;
let weightedConfig: ResolvedRoutingConfig;

beforeEach(() => {
  engine = createDefaultConfigRoutingEngine();
  weightedConfig = createWeightedConfig({
    'test/fast-model': 6,
    'test/free-model': 3,
    'test/paid-model': 1,
  });
  engine.updateConfig(weightedConfig);
});

function itKeepsInstancesIndependent() {
  const other = createDefaultConfigRoutingEngine();
  const first = routeSequence(engine, weightedConfig, 1);
  const second = routeSequence(other, weightedConfig, 1);
  expect(second.ids).toEqual(first.ids);

  const advanced = engine.route(
    createWeightedRequest(weightedConfig, { runtimeState: first.runtimeState }),
  );
  expect(advanced.result.selectedModel?.id).not.toBe(first.ids[0]);
  expect(routeSequence(other, weightedConfig, 1).ids).toEqual(first.ids);
}

function itKeepsCategoriesIndependent() {
  const documentationCategory: RoutingCategoryConfig = {
    id: 'documentation',
    name: 'Documentation',
    description: 'Weighted documentation routing',
    modelIds: [...WEIGHTED_MODEL_IDS],
    defaultStrategy: 'weighted',
    enabled: true,
  };
  weightedConfig.categories.push(documentationCategory);

  const coding = routeSequence(engine, weightedConfig, 3);
  const documentation = routeSequence(engine, weightedConfig, 1, { category: 'documentation' });
  expect(documentation.ids[0]).toBe(coding.ids[0]);

  const shared = engine.route(
    createWeightedRequest(weightedConfig, {
      category: 'documentation',
      runtimeState: coding.runtimeState,
    }),
  );
  expect(shared.result.selectedModel?.id).toBe(documentation.ids[0]);
  expect(Object.keys(shared.updatedRuntimeState.weightedState ?? {}).sort()).toEqual([
    'coding',
    'documentation',
  ]);
}

function itResetsWithFreshState() {
  const advanced = routeSequence(engine, weightedConfig, 2);
  expect(advanced.ids[1]).not.toBe(advanced.ids[0]);
  const freshState: RoutingRuntimeState = {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };
  const fresh = engine.route(createWeightedRequest(weightedConfig, { runtimeState: freshState }));
  expect(fresh.result.selectedModel?.id).toBe(advanced.ids[0]);
}

function itResetsLegacyStateWithoutWeightSnapshot() {
  const legacyState: RoutingRuntimeState = {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
    weightedState: {
      coding: {
        currentWeights: {
          'test/fast-model': -100,
          'test/free-model': 50,
          'test/paid-model': 50,
        },
        eligibleModelIds: [...WEIGHTED_MODEL_IDS],
        lastUpdated: Date.now(),
      },
    },
  };
  const { result } = engine.route(
    createWeightedRequest(weightedConfig, { runtimeState: legacyState }),
  );
  // Legacy state has no weight snapshot, so accumulated state is discarded.
  expect(result.selectedModel?.id).toBe('test/fast-model');
}

function itSimulatesChangedWeightsWithoutMutation() {
  const equalConfig = createWeightedConfig({
    'test/fast-model': 1,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const live = routeSequence(engine, equalConfig, 2);
  const snapshot = structuredClone(live.runtimeState);
  const changedConfig = createWeightedConfig({
    'test/fast-model': 2,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const simulation = engine.simulate(SIMULATION, changedConfig, live.runtimeState);

  // Changed weights discard the stale equal-weight state during simulation.
  expect(simulation.selectedModel?.model.id).toBe('test/fast-model');
  expect(live.runtimeState).toEqual(snapshot);
}

function itSimulatesWithoutMutation() {
  const live = routeSequence(engine, weightedConfig, 1);
  const snapshot = structuredClone(live.runtimeState);
  const firstSimulation = engine.simulate(SIMULATION, weightedConfig, live.runtimeState);
  const secondSimulation = engine.simulate(SIMULATION, weightedConfig, live.runtimeState);

  expect(firstSimulation.selectedModel?.model.id).toBe('test/free-model');
  expect(secondSimulation.selectedModel?.model.id).toBe(firstSimulation.selectedModel?.model.id);
  expect(live.runtimeState).toEqual(snapshot);
}

function itExposesConfiguredWeights() {
  const simulation = engine.simulate(SIMULATION, weightedConfig);
  expect(simulation.selectedModel?.model.id).toBe('test/fast-model');
  expect(simulation.selectedModel?.model.weight).toBe(6);
}

function itContinuesFromSimulatedState() {
  const live = routeSequence(engine, weightedConfig, 1);
  const simulation = engine.simulate(SIMULATION, weightedConfig, live.runtimeState);
  const next = engine.route(
    createWeightedRequest(weightedConfig, { runtimeState: live.runtimeState }),
  );
  expect(next.result.selectedModel?.id).toBe(simulation.selectedModel?.model.id);
}

function itDefaultsWeightToOne() {
  const models = structuredClone(MODEL_FIXTURES);
  const category: RoutingCategoryConfig = {
    id: 'coding',
    name: 'Coding',
    description: 'Default weight routing',
    modelIds: [...WEIGHTED_MODEL_IDS],
    defaultStrategy: 'weighted',
    enabled: true,
  };
  const config = buildTestResolvedConfig(models, [category]);
  const { ids } = routeSequence(engine, config, 6);
  expect(ids).toEqual([
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
  ]);
}

function itKeepsRoundRobinUnchanged() {
  const config = createWeightedConfig(
    { 'test/fast-model': 6, 'test/free-model': 3, 'test/paid-model': 1 },
    'round-robin',
  );
  const { ids } = routeSequence(engine, config, 6);
  expect(ids).toEqual([
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
  ]);
}

function itKeepsNonWeightedStrategiesUnchanged() {
  const config = createWeightedConfig(
    { 'test/fast-model': 6, 'test/free-model': 3, 'test/paid-model': 1 },
    'capability-match',
  );
  const { ids } = routeSequence(engine, config, 3);
  expect(ids).toEqual(Array(3).fill('test/free-model'));
}

describe('Weighted routing - state and simulation', () => {
  it('keeps router instances independent', itKeepsInstancesIndependent);
  it('keeps weighted state independent per category', itKeepsCategoriesIndependent);
  it('resets when fresh runtime state is provided', itResetsWithFreshState);
  it('resets legacy state without a weight snapshot', itResetsLegacyStateWithoutWeightSnapshot);
  it(
    'simulates changed weights without mutating live state',
    itSimulatesChangedWeightsWithoutMutation,
  );
  it('simulates without mutating live weighted state', itSimulatesWithoutMutation);
  it('exposes configured weights in simulation results', itExposesConfiguredWeights);
  it('continues live routing from the simulated state', itContinuesFromSimulatedState);
  it('defaults missing model weights to one', itDefaultsWeightToOne);
  it('keeps round robin rotation unaffected by weights', itKeepsRoundRobinUnchanged);
  it('keeps non-weighted strategies unaffected', itKeepsNonWeightedStrategiesUnchanged);
});
