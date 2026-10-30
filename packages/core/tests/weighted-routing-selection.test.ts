/**
 * Tests for Weighted routing selection behavior.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import { createDefaultConfigRoutingEngine } from '../src/routing/config-engine.js';
import type {
  ConfigValidationError,
  ConfigValidationWarning,
  ResolvedRoutingConfig,
} from '../src/routing/config.js';
import { validateModels } from '../src/routing/config-validate-models.js';
import {
  countSelections,
  createWeightedConfig,
  createWeightedRequest,
  routeSequence,
} from './weighted-fixtures.js';

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

function itSelectsProportionally() {
  const { ids } = routeSequence(engine, weightedConfig, 10);
  expect(ids).toEqual([
    'test/fast-model',
    'test/free-model',
    'test/fast-model',
    'test/fast-model',
    'test/free-model',
    'test/fast-model',
    'test/paid-model',
    'test/fast-model',
    'test/free-model',
    'test/fast-model',
  ]);
  expect(countSelections(ids)).toEqual({
    'test/fast-model': 6,
    'test/free-model': 3,
    'test/paid-model': 1,
  });
}

function itDistributesEqually() {
  const config = createWeightedConfig({
    'test/fast-model': 1,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const { ids } = routeSequence(engine, config, 9);
  expect(ids).toEqual([
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
    'test/fast-model',
    'test/free-model',
    'test/paid-model',
  ]);
}

function itSkipsZeroWeightModels() {
  const config = createWeightedConfig({
    'test/fast-model': 0,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const { ids } = routeSequence(engine, config, 8);
  expect(ids).not.toContain('test/fast-model');
  expect(countSelections(ids)).toEqual({ 'test/free-model': 4, 'test/paid-model': 4 });
}

function itFallsBackWithoutPositiveWeight() {
  const config = createWeightedConfig({
    'test/fast-model': 0,
    'test/free-model': 0,
    'test/paid-model': 0,
  });
  const { ids } = routeSequence(engine, config, 4);
  expect(ids).toEqual(Array(4).fill('test/fast-model'));
}

function itTreatsInvalidWeightsAsZero() {
  const config = createWeightedConfig({
    'test/fast-model': -5,
    'test/free-model': Number.NaN,
    'test/paid-model': 2,
  });
  const { ids } = routeSequence(engine, config, 6);
  expect(ids).toEqual(Array(6).fill('test/paid-model'));
}

function itRejectsInvalidWeightsInValidation() {
  const errors: ConfigValidationError[] = [];
  const warnings: ConfigValidationWarning[] = [];
  const models = [-1, Number.NaN, Number.POSITIVE_INFINITY].map((weight, index) => ({
    id: `test/invalid-${index}`,
    provider: 'test',
    capabilities: ['coding'],
    priority: 50,
    costClassification: 'free',
    enabled: true,
    weight,
  }));
  validateModels(models, errors, warnings);
  expect(errors.filter((error) => error.code === 'INVALID_WEIGHT')).toHaveLength(3);
}

function itSkipsExcludedHighWeightCandidates() {
  const { ids } = routeSequence(engine, weightedConfig, 8, { excludedProviders: ['other'] });
  expect(ids).not.toContain('test/fast-model');
  expect(countSelections(ids)).toEqual({ 'test/free-model': 6, 'test/paid-model': 2 });
}

function itHandlesSingleCandidate() {
  const config = createWeightedConfig({ 'test/paid-model': 5 }, 'weighted', 'coding', [
    'test/paid-model',
  ]);
  const { ids } = routeSequence(engine, config, 3);
  expect(ids).toEqual(Array(3).fill('test/paid-model'));
}

function itReturnsNoMatchWhenAllExcluded() {
  const { result } = engine.route(
    createWeightedRequest(weightedConfig, { excludedProviders: ['test', 'other'] }),
  );
  expect(result.selectedModel).toBeNull();
  expect(result.metadata.noMatch).toBe(true);
}

function itResetsWhenCandidatesChange() {
  const first = routeSequence(engine, weightedConfig, 2);
  const reduced = engine.route(
    createWeightedRequest(weightedConfig, {
      excludedProviders: ['other'],
      runtimeState: first.runtimeState,
    }),
  );
  expect(reduced.result.selectedModel?.id).not.toBe('test/fast-model');
  const restored = engine.route(
    createWeightedRequest(weightedConfig, { runtimeState: reduced.updatedRuntimeState }),
  );
  expect(restored.result.selectedModel?.id).toBe('test/fast-model');
}

function itResetsWhenWeightsChange() {
  const equalConfig = createWeightedConfig({
    'test/fast-model': 1,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const initial = routeSequence(engine, equalConfig, 2);
  expect(initial.ids).toEqual(['test/fast-model', 'test/free-model']);

  const changedConfig = createWeightedConfig({
    'test/fast-model': 2,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const { ids } = routeSequence(engine, changedConfig, 4, {
    runtimeState: initial.runtimeState,
  });
  // Stale equal-weight state would start with paid-model; reconciled state uses the new mix.
  expect(ids).toEqual(['test/fast-model', 'test/free-model', 'test/paid-model', 'test/fast-model']);
}

function itIgnoresZeroWeightAfterWeightChange() {
  const initial = routeSequence(engine, weightedConfig, 2);
  const config = createWeightedConfig({
    'test/fast-model': 0,
    'test/free-model': 1,
    'test/paid-model': 1,
  });
  const { ids } = routeSequence(engine, config, 6, { runtimeState: initial.runtimeState });
  expect(ids).not.toContain('test/fast-model');
}

function itProducesIdenticalSequences() {
  const config = createWeightedConfig({
    'test/fast-model': 4,
    'test/free-model': 2,
    'test/paid-model': 1,
  });
  const first = routeSequence(engine, config, 14);
  const second = routeSequence(createDefaultConfigRoutingEngine(), config, 14);
  expect(second.ids).toEqual(first.ids);
}

describe('Weighted routing - selection', () => {
  it('selects 60/30/10 proportionally and deterministically', itSelectsProportionally);
  it('distributes equally when all weights are equal', itDistributesEqually);
  it('never selects zero-weight models', itSkipsZeroWeightModels);
  it('falls back deterministically when no weight is positive', itFallsBackWithoutPositiveWeight);
  it('treats negative and non-finite weights as zero', itTreatsInvalidWeightsAsZero);
  it('rejects invalid weights during config validation', itRejectsInvalidWeightsInValidation);
  it(
    'skips excluded candidates even when their weight is highest',
    itSkipsExcludedHighWeightCandidates,
  );
  it('handles a single candidate', itHandlesSingleCandidate);
  it('returns no match when every candidate is excluded', itReturnsNoMatchWhenAllExcluded);
  it('resets safely when the candidate list changes', itResetsWhenCandidatesChange);
  it('resets accumulated state when weights change', itResetsWhenWeightsChange);
  it('never selects a model whose weight becomes zero', itIgnoresZeroWeightAfterWeightChange);
  it('produces identical sequences across independent runs', itProducesIdenticalSequences);
});
