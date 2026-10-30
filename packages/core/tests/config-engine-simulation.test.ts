import { CATEGORY_FIXTURES, MODEL_FIXTURES, buildTestResolvedConfig } from './config-fixtures.js';
/**
 * Tests for ConfigRoutingEngine
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ConfigRoutingEngine } from '../src/routing/config-engine.js';
import { createDefaultConfigRoutingEngine } from '../src/routing/config-engine.js';
import type {
  ConfigRouteRequest,
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
} from '../src/routing/config.js';
import type { CoreContext } from '../src/types.js';
let engine: ConfigRoutingEngine;
let resolvedConfig: ResolvedRoutingConfig;
let testModels: ModelConfig[];
let testCategories: RoutingCategoryConfig[];
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
describe('ConfigRoutingEngine', describeConfigRoutingEngine0);
function beforeEachBeforeEach1() {
  engine = createDefaultConfigRoutingEngine();
  testModels = structuredClone(MODEL_FIXTURES);
  testCategories = structuredClone(CATEGORY_FIXTURES);
  resolvedConfig = buildTestResolvedConfig(testModels, testCategories);
  testContext = {
    requestId: 'test-request',
    timestamp: Date.now(),
    sessionId: 'test-session',
  };
}
function itShouldSimulateRoutingWithoutCallingLLM3() {
  const result = engine.simulate(
    {
      task: 'Write a function',
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
  );
  expect(result.permitted).toBe(true);
  expect(result.selectedModel).not.toBeNull();
  expect(result.candidates.length).toBeGreaterThan(0);
  expect(result.metadata.heuristicCategory).toBe(true);
}
function itShouldUseExplicitCategoryInSimulation4() {
  const result = engine.simulate(
    {
      task: 'Write a function',
      category: 'coding',
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
  );
  expect(result.category).toBe('coding');
  expect(result.metadata.heuristicCategory).toBe(false);
}
function itShouldShowExcludedModelsWithReasons5() {
  const result = engine.simulate(
    {
      task: 'Write a function',
      excludedProviders: ['test'],
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
  );
  expect(result.candidates.some((c) => c.excluded)).toBe(true);
  const excluded = result.candidates.find((c) => c.excluded);
  expect(excluded?.exclusionReasons.length).toBeGreaterThan(0);
}
function itShouldApplyFreeOnlyCostPolicyIn6() {
  const freeOnlyConfig: ResolvedRoutingConfig = {
    ...resolvedConfig,
    costPolicy: { ...resolvedConfig.costPolicy, freeOnly: true },
  };
  const result = engine.simulate(
    {
      task: 'Write a function',
      requiredCapabilities: ['coding'],
    },
    freeOnlyConfig,
  );
  expect(result.costPolicy.freeOnly).toBe(true);
  const paidModel = result.candidates.find((c) => c.model.id === 'test/paid-model');
  expect(paidModel?.excluded).toBe(true);
  expect(paidModel?.exclusionReasons).toContain('Model is paid but free-only mode is enabled');
}
function itShouldDetectCategoryHeuristically7() {
  const result = engine.simulate(
    {
      task: 'Debug this code and fix the bug',
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
  );
  // Should detect coding category from keywords
  expect(result.category).toBe('coding');
  expect(result.metadata.heuristicCategory).toBe(true);
}
function itShouldReturnPermittedFalseWhenNoModels8() {
  const result = engine.simulate(
    {
      task: 'Write a function',
      excludedProviders: ['test', 'other'],
      requiredCapabilities: ['coding'],
    },
    resolvedConfig,
  );
  expect(result.permitted).toBe(false);
  expect(result.rejectionReason).toBeDefined();
}
function itShouldIncludeCostPolicyInSimulationResult9() {
  const result = engine.simulate(
    {
      task: 'Write a function',
    },
    resolvedConfig,
  );
  expect(result.costPolicy).toEqual(resolvedConfig.costPolicy);
}
function itShouldIncludeActiveCooldowns10() {
  const result = engine.simulate(
    {
      task: 'Write a function',
    },
    resolvedConfig,
  );
  expect(Array.isArray(result.activeCooldowns)).toBe(true);
}
function describeSimulate2() {
  it('should simulate routing without calling LLM', itShouldSimulateRoutingWithoutCallingLLM3);
  it('should use explicit category in simulation', itShouldUseExplicitCategoryInSimulation4);
  it('should show excluded models with reasons', itShouldShowExcludedModelsWithReasons5);
  it('should apply free-only cost policy in simulation', itShouldApplyFreeOnlyCostPolicyIn6);
  it('should detect category heuristically', itShouldDetectCategoryHeuristically7);
  it(
    'should return permitted false when no models match',
    itShouldReturnPermittedFalseWhenNoModels8,
  );
  it(
    'should include cost policy in simulation result',
    itShouldIncludeCostPolicyInSimulationResult9,
  );
  it('should include active cooldowns', itShouldIncludeActiveCooldowns10);
}
function itShouldNeverSelectADisabledModel12() {
  const request = createRequest({
    requiredCapabilities: ['coding'],
  });
  const result = engine.route(request);
  // Even if disabled model has highest priority, it should not be selected
  expect(result.selectedModel?.id).not.toBe('test/disabled-model');
}
function itShouldNeverSelectModelNotInAllowlist13() {
  const request = createRequest({
    requiredCapabilities: ['coding'],
  });
  const result = engine.route(request);
  // Only models from the category's modelIds should be considered
  expect(['test/free-model', 'test/paid-model', 'test/fast-model']).toContain(
    result.selectedModel?.id,
  );
}
function itShouldFailClosedWhenNoPermittedModel14() {
  const request = createRequest({
    excludedProviders: ['test', 'other'],
    requiredCapabilities: ['coding'],
  });
  const result = engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
}
function itShouldEnforceFreeOnlyModeStrictly15() {
  const freeOnlyConfig: ResolvedRoutingConfig = {
    ...resolvedConfig,
    costPolicy: { ...resolvedConfig.costPolicy, freeOnly: true },
  };
  const request = createRequest({
    requiredCapabilities: ['analysis'], // Only paid-model has this
    resolvedConfig: freeOnlyConfig,
  });
  const result = engine.route(request);
  // Should not select paid model even though it's the only one with 'analysis' capability
  expect(result.selectedModel).toBeNull();
  expect(result.metadata.noMatch).toBe(true);
}
function itShouldNotSilentlyFallbackToUnapprovedModel16() {
  const request = createRequest({
    requiredCapabilities: ['nonexistent-capability'],
  });
  const result = engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.metadata.noMatch).toBe(true);
  // No fallback to any model
}
function describeSafetyInvariants11() {
  it('should never select a disabled model', itShouldNeverSelectADisabledModel12);
  it('should never select model not in allowlist', itShouldNeverSelectModelNotInAllowlist13);
  it('should fail closed when no permitted model', itShouldFailClosedWhenNoPermittedModel14);
  it('should enforce free-only mode strictly', itShouldEnforceFreeOnlyModeStrictly15);
  it(
    'should not silently fallback to unapproved model',
    itShouldNotSilentlyFallbackToUnapprovedModel16,
  );
}
function describeConfigRoutingEngine0() {
  beforeEach(beforeEachBeforeEach1);
  describe('simulate', describeSimulate2);
  describe('safety invariants', describeSafetyInvariants11);
}
