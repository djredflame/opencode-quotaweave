/**
 * Tests for Round Robin routing strategy
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import { createDefaultConfigRoutingEngine } from '../src/routing/config-engine.js';
import type {
  ConfigRouteRequest,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingRuntimeState,
} from '../src/routing/config.js';
import type { CoreContext } from '../src/types.js';
import { CATEGORY_FIXTURES, MODEL_FIXTURES, buildTestResolvedConfig } from './config-fixtures.js';

let engine: ConfigRoutingEngine;
let resolvedConfig: ResolvedRoutingConfig;
let testContext: CoreContext;

function createRequest(overrides: Partial<ConfigRouteRequest> = {}): ConfigRouteRequest {
  return {
    task: 'Implement a REST API',
    requiredCapabilities: ['coding'],
    context: testContext,
    resolvedConfig,
    ...overrides,
  };
}

function createRoundRobinConfig(): ResolvedRoutingConfig {
  const models = structuredClone(MODEL_FIXTURES);
  const categories = structuredClone(CATEGORY_FIXTURES).filter((c) => c.id !== 'quick');
  // Use 'quick' category (predefined) and override to round-robin with multiple models
  const roundRobinCategory: RoutingCategoryConfig = {
    id: 'quick',
    name: 'Quick',
    description: 'Round robin test',
    modelIds: ['test/free-model', 'test/paid-model', 'test/fast-model'],
    defaultStrategy: 'round-robin',
    enabled: true,
  };
  return buildTestResolvedConfig(models, [...categories, roundRobinCategory]);
}

describe('ConfigRoutingEngine - Round Robin Strategy', describeRoundRobin0);

function beforeEachBeforeEach1() {
  engine = createDefaultConfigRoutingEngine();
  resolvedConfig = createRoundRobinConfig();
  testContext = {
    requestId: 'test-request',
    timestamp: Date.now(),
    sessionId: 'test-session',
  };
}

function itShouldRotateDeterministicallyAtoBtoCtoA3() {
  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
  });

  // First call - should select first model (alphabetically: fast-model, free-model, paid-model)
  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  expect(result1.selectedModel).not.toBeNull();
  const firstModel = result1.selectedModel!.id;

  // Second call - should select next model
  const request2 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: state1,
  });
  const { result: result2, updatedRuntimeState: state2 } = engine.route(request2);
  expect(result2.selectedModel).not.toBeNull();
  const secondModel = result2.selectedModel!.id;
  expect(secondModel).not.toBe(firstModel);

  // Third call - should select third model
  const request3 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: state2,
  });
  const { result: result3, updatedRuntimeState: state3 } = engine.route(request3);
  expect(result3.selectedModel).not.toBeNull();
  const thirdModel = result3.selectedModel!.id;
  expect(thirdModel).not.toBe(firstModel);
  expect(thirdModel).not.toBe(secondModel);

  // Fourth call - should wrap around to first model
  const request4 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: state3,
  });
  const { result: result4 } = engine.route(request4);
  expect(result4.selectedModel).not.toBeNull();
  expect(result4.selectedModel!.id).toBe(firstModel);
}

function itShouldSkipExcludedCandidates4() {
  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    excludedProviders: ['other'], // Excludes fast-model
  });

  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  expect(result1.selectedModel).not.toBeNull();
  expect(result1.selectedModel!.id).not.toBe('test/fast-model');
  const firstModel = result1.selectedModel!.id;

  // Second call - should select the other non-excluded model
  const request2 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    excludedProviders: ['other'],
    runtimeState: state1,
  });
  const { result: result2, updatedRuntimeState: state2 } = engine.route(request2);
  expect(result2.selectedModel).not.toBeNull();
  expect(result2.selectedModel!.id).not.toBe('test/fast-model');
  const secondModel = result2.selectedModel!.id;
  expect(secondModel).not.toBe(firstModel);

  // Third call - should wrap around to first non-excluded model
  const request3 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    excludedProviders: ['other'],
    runtimeState: state2,
  });
  const { result: result3 } = engine.route(request3);
  expect(result3.selectedModel).not.toBeNull();
  expect(result3.selectedModel!.id).toBe(firstModel);
}

function itShouldHandleEmptyCandidates5() {
  const request = createRequest({
    category: 'quick',
    excludedProviders: ['test', 'other'], // Excludes all models
    requiredCapabilities: ['coding'],
  });

  const { result } = engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noMatch).toBe(true);
}

function itShouldHandleSingleCandidate6() {
  // Create config with only one model in round-robin category
  const freeModel = MODEL_FIXTURES.find((m) => m.id === 'test/free-model');
  if (!freeModel) throw new Error('free-model not found in fixtures');
  const singleModelConfig = buildTestResolvedConfig(
    [structuredClone(freeModel)], // Only free-model
    [
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Single model category',
        modelIds: ['test/free-model'],
        defaultStrategy: 'round-robin',
        enabled: true,
      },
    ],
  );
  engine.updateConfig(singleModelConfig);

  const request = createRequest({
    category: 'documentation',
    requiredCapabilities: ['coding'],
    resolvedConfig: singleModelConfig,
  });

  // Multiple calls should always return the same single model
  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  expect(result1.selectedModel?.id).toBe('test/free-model');

  const request2 = createRequest({
    category: 'documentation',
    requiredCapabilities: ['coding'],
    resolvedConfig: singleModelConfig,
    runtimeState: state1,
  });
  const { result: result2 } = engine.route(request2);
  expect(result2.selectedModel?.id).toBe('test/free-model');
}

function itShouldResetWhenCandidateListChanges7() {
  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
  });

  // First call
  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  const firstModel = result1.selectedModel!.id;

  // Second call
  const request2 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: state1,
  });
  const { result: result2, updatedRuntimeState: state2 } = engine.route(request2);
  const secondModel = result2.selectedModel!.id;
  expect(secondModel).not.toBe(firstModel);

  // Now change the candidate list (exclude one model)
  const request3 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    excludedProviders: ['other'], // Excludes fast-model
    runtimeState: state2,
  });
  const { result: result3, updatedRuntimeState: state3 } = engine.route(request3);
  // Should reset to first eligible model (alphabetically: free-model, paid-model)
  expect(result3.selectedModel).not.toBeNull();

  // Next call should continue from the new first model
  const request4 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    excludedProviders: ['other'],
    runtimeState: state3,
  });
  const { result: result4 } = engine.route(request4);
  expect(result4.selectedModel).not.toBeNull();
  expect(result4.selectedModel!.id).not.toBe(result3.selectedModel!.id);
}

function itShouldMaintainIndependentRotationStatePerInstance8() {
  const engine2 = createDefaultConfigRoutingEngine();
  engine2.updateConfig(resolvedConfig);

  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
  });

  // Both engines start at first model
  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  const { result: result2 } = engine2.route(request);
  expect(result1.selectedModel!.id).toBe(result2.selectedModel!.id);

  // Advance first engine using its updated state
  const { result: result1b, updatedRuntimeState: _state1b } = engine.route({
    ...request,
    runtimeState: state1,
  });
  expect(result1b.selectedModel!.id).not.toBe(result1.selectedModel!.id);

  // Second engine should still be at first model (using fresh state)
  const { result: result2b } = engine2.route(request);
  expect(result2b.selectedModel!.id).toBe(result1.selectedModel!.id);
}

function itShouldResetRotationStateExplicitly9() {
  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
  });

  // Advance rotation
  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  const { result: result2, updatedRuntimeState: _state2 } = engine.route({
    ...request,
    runtimeState: state1,
  });
  expect(result2.selectedModel!.id).not.toBe(result1.selectedModel!.id);

  // Reset by providing fresh runtime state without roundRobinState
  const freshState: RoutingRuntimeState = {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };
  const request3 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: freshState,
  });
  const { result: result3 } = engine.route(request3);
  // Should be back to first model
  expect(result3.selectedModel!.id).toBe(result1.selectedModel!.id);
}

function itShouldNotMutateRuntimeStateInSimulation10() {
  const request = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
  });

  // Advance live routing state
  const { result: _result1, updatedRuntimeState: state1 } = engine.route(request);
  const { result: _result2, updatedRuntimeState: state2 } = engine.route({
    ...request,
    runtimeState: state1,
  });

  // Simulate with the advanced state - should not mutate it
  engine.simulate(
    {
      task: 'Test simulation',
      category: 'quick',
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
    state2,
  );

  // Next live routing call should continue from where it left off
  const request3 = createRequest({
    category: 'quick',
    requiredCapabilities: ['coding'],
    runtimeState: state2,
  });
  const { result: result3 } = engine.route(request3);
  // Should be the third model (wrapping if needed)
  expect(result3.selectedModel).not.toBeNull();
}

function itShouldPreserveNonRoundRobinBehavior11() {
  // Use default capability-match strategy
  const request = createRequest({
    category: 'general', // Uses capability-match by default
    requiredCapabilities: ['coding'],
  });

  const { result: result1, updatedRuntimeState: state1 } = engine.route(request);
  const { result: result2 } = engine.route({ ...request, runtimeState: state1 });

  // Should consistently select the best model (not rotate)
  expect(result1.selectedModel?.id).toBe(result2.selectedModel?.id);
  expect(result1.selectedModel?.id).toBe('test/free-model'); // Highest priority with coding capability
}

function describeRoundRobin0() {
  beforeEach(beforeEachBeforeEach1);
  describe('round-robin rotation', () => {
    it('should rotate deterministically A → B → C → A', itShouldRotateDeterministicallyAtoBtoCtoA3);
    it('should skip excluded candidates', itShouldSkipExcludedCandidates4);
    it('should handle empty candidates', itShouldHandleEmptyCandidates5);
    it('should handle single candidate', itShouldHandleSingleCandidate6);
    it('should reset when candidate list changes', itShouldResetWhenCandidateListChanges7);
    it(
      'should maintain independent rotation state per instance',
      itShouldMaintainIndependentRotationStatePerInstance8,
    );
    it('should reset rotation state explicitly', itShouldResetRotationStateExplicitly9);
    it(
      'should not mutate runtime state in simulation',
      itShouldNotMutateRuntimeStateInSimulation10,
    );
    it('should preserve non-round-robin behavior', itShouldPreserveNonRoundRobinBehavior11);
  });
}
