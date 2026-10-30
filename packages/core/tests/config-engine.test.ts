import { CATEGORY_FIXTURES, MODEL_FIXTURES, buildTestResolvedConfig } from './config-fixtures.js';
import { requiredItem } from './required-item.js';
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
function itShouldSelectBestMatchingModelForGeneral3() {
  const request = createRequest({
    task: 'Implement a REST API',
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.capabilities).toContain('coding');
  expect(result.confidence).toBeGreaterThan(0);
  expect(result.metadata.category).toBe('general');
}
function itShouldUseExplicitCategoryWhenProvided4() {
  const request = createRequest({
    category: 'coding',
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.metadata.category).toBe('coding');
}
function itShouldRejectWhenCategoryNotFound5() {
  const request = createRequest({
    category: 'nonexistent',
  });
  const { result } = engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noCategory).toBe(true);
}
function itShouldFilterByExcludedProviders6() {
  const request = createRequest({
    excludedProviders: ['test'],
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.provider).toBe('other');
  expect(result.selectedModel?.id).toBe('test/fast-model');
}
function itShouldFilterByPreferredProviders7() {
  const request = createRequest({
    preferredProviders: ['other'],
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.provider).toBe('other');
}
function itShouldFilterByMaxCost8() {
  const request = createRequest({
    maxCost: 0.001, // Very low, only free model should pass
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.id).toBe('test/free-model');
}
function itShouldFilterByMaxLatency9() {
  const request = createRequest({
    maxLatencyMs: 300, // Only fast-model should pass
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.id).toBe('test/fast-model');
}
function itShouldFilterByRequiredCapabilities10() {
  const request = createRequest({
    requiredCapabilities: ['analysis'], // Only paid-model has this
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.id).toBe('test/paid-model');
}
function itShouldRespectFreeOnlyCostPolicy11() {
  const freeOnlyConfig: ResolvedRoutingConfig = {
    ...resolvedConfig,
    costPolicy: { ...resolvedConfig.costPolicy, freeOnly: true },
  };
  const request = createRequest({
    requiredCapabilities: ['coding'],
    resolvedConfig: freeOnlyConfig,
  });
  const { result } = engine.route(request);
  expect(result.selectedModel?.id).toBe('test/free-model');
  expect(result.rejectionReasons['test/paid-model']).toContain(
    'Model is paid but free-only mode is enabled',
  );
}
function itShouldRejectDisabledModels12() {
  const request = createRequest({
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  // disabled-model should not be selected
  expect(result.selectedModel?.id).not.toBe('test/disabled-model');
  // It should be in rejection reasons
  expect(result.rejectionReasons).toBeDefined();
}
function itShouldReturnRejectionReasonsForAllExcluded13() {
  const request = createRequest({
    excludedProviders: ['test'],
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  // Only models in the category are considered for routing
  expect(result.rejectionReasons['test/free-model']).toContain('Provider test is excluded');
  expect(result.rejectionReasons['test/paid-model']).toContain('Provider test is excluded');
  // Disabled model is not in the category's modelIds, so it's not considered
  expect(result.rejectionReasons['test/disabled-model']).toBeUndefined();
}
function itShouldReturnNoMatchWhenAllModels14() {
  const request = createRequest({
    excludedProviders: ['test', 'other'],
    requiredCapabilities: ['coding'],
  });
  const { result } = engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.metadata.noMatch).toBe(true);
  expect(Object.keys(result.rejectionReasons).length).toBeGreaterThan(0);
}
function itShouldUseDefaultCategoryWhenNoneSpecified15() {
  const request = createRequest({});
  // Use type-safe property deletion
  const { category, ...requestWithoutCategory } = request;
  void category; // Suppress unused warning
  const { result } = engine.route(requestWithoutCategory);
  expect(result.metadata.category).toBe('general');
}
function itShouldFallBackToFirstEnabledCategory16() {
  const configWithDisabledDefault: ResolvedRoutingConfig = {
    ...resolvedConfig,
    defaultCategory: 'documentation',
    categories: [
      { ...requiredItem(testCategories, 0), id: 'documentation', enabled: false },
      requiredItem(testCategories, 1), // coding
    ],
  };
  const request = createRequest({
    resolvedConfig: configWithDisabledDefault,
  });
  const { result } = engine.route(request);
  expect(result.metadata.category).toBe('coding');
}
function describeRoute2() {
  it(
    'should select best matching model for general task',
    itShouldSelectBestMatchingModelForGeneral3,
  );
  it('should use explicit category when provided', itShouldUseExplicitCategoryWhenProvided4);
  it('should reject when category not found', itShouldRejectWhenCategoryNotFound5);
  it('should filter by excluded providers', itShouldFilterByExcludedProviders6);
  it('should filter by preferred providers', itShouldFilterByPreferredProviders7);
  it('should filter by max cost', itShouldFilterByMaxCost8);
  it('should filter by max latency', itShouldFilterByMaxLatency9);
  it('should filter by required capabilities', itShouldFilterByRequiredCapabilities10);
  it('should respect free-only cost policy', itShouldRespectFreeOnlyCostPolicy11);
  it('should reject disabled models', itShouldRejectDisabledModels12);
  it(
    'should return rejection reasons for all excluded models',
    itShouldReturnRejectionReasonsForAllExcluded13,
  );
  it('should return no match when all models excluded', itShouldReturnNoMatchWhenAllModels14);
  it(
    'should use default category when none specified',
    itShouldUseDefaultCategoryWhenNoneSpecified15,
  );
  it(
    'should fall back to first enabled category if default disabled',
    itShouldFallBackToFirstEnabledCategory16,
  );
}
function describeConfigRoutingEngine0() {
  beforeEach(beforeEachBeforeEach1);
  describe('route', describeRoute2);
}
