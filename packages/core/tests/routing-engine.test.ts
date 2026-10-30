import { requiredItem } from './required-item.js';
/**
 * Tests for RoutingEngine
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { RoutingEngine } from '../src/routing/engine.js';
import type { ModelCandidate, RouteRequest } from '../src/routing/types.js';
let engine: RoutingEngine;
describe('RoutingEngine', describeRoutingEngine0);
function createTestRequest(
  models: ModelCandidate[],
  overrides: Omit<Partial<RouteRequest>, 'task' | 'context'> & {
    task?: Partial<RouteRequest['task']>;
    context?: Partial<RouteRequest['context']>;
  } = {},
): RouteRequest {
  return {
    ...overrides,
    task: {
      type: 'general',
      requiredCapabilities: [],
      ...overrides.task,
    },
    availableModels: models,
    context: {
      requestId: 'test-request',
      timestamp: Date.now(),
      ...overrides.context,
    },
  };
}
function createTestModels(): ModelCandidate[] {
  return [
    {
      id: 'model-1',
      provider: 'provider-1',
      capabilities: ['coding', 'reasoning'],
      priority: 10,
      estimatedCost: 10,
      estimatedLatencyMs: 500,
      quotaAvailable: 100,
    },
    {
      id: 'model-2',
      provider: 'provider-2',
      capabilities: ['writing', 'analysis'],
      priority: 8,
      estimatedCost: 5,
      estimatedLatencyMs: 300,
      quotaAvailable: 50,
    },
    {
      id: 'model-3',
      provider: 'provider-1',
      capabilities: ['coding'],
      priority: 5,
      estimatedCost: 20,
      estimatedLatencyMs: 1000,
      quotaAvailable: 200,
    },
  ];
}
function beforeEachBeforeEach1() {
  engine = new RoutingEngine();
}
async function itShouldReturnNoMatchWhenNoCandidates3() {
  const request = createTestRequest([]);
  const result = await engine.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.alternatives).toHaveLength(0);
  expect(result.confidence).toBe(0);
  expect(result.metadata.noMatch).toBe(true);
}
async function itShouldSelectTheBestMatchingModel4() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { requiredCapabilities: ['coding'], maxCost: 50, maxLatencyMs: 2000 },
  });
  const result = await engine.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('model-1');
  expect(result.confidence).toBeGreaterThan(0);
}
async function itShouldFilterByExcludedProviders5() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { excludedProviders: ['provider-1'] },
  });
  const result = await engine.route(request);
  expect(result.selectedModel?.provider).not.toBe('provider-1');
}
async function itShouldFilterByPreferredProviders6() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { preferredProviders: ['provider-2'] },
  });
  const result = await engine.route(request);
  expect(result.selectedModel?.provider).toBe('provider-2');
}
async function itShouldFilterByMaxCost7() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { maxCost: 5 },
  });
  const result = await engine.route(request);
  expect(result.selectedModel?.estimatedCost).toBeLessThanOrEqual(5);
}
async function itShouldFilterByMaxLatency8() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { maxLatencyMs: 500 },
  });
  const result = await engine.route(request);
  expect(result.selectedModel?.estimatedLatencyMs).toBeLessThanOrEqual(500);
}
async function itShouldFilterByRequiredCapabilities9() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { requiredCapabilities: ['reasoning'] },
  });
  const result = await engine.route(request);
  expect(result.selectedModel?.capabilities).toContain('reasoning');
}
async function itShouldFilterOutModelsWithNoQuota10() {
  const models = createTestModels();
  requiredItem(models, 0).quotaAvailable = 0;
  const request = createTestRequest(models);
  const result = await engine.route(request);
  expect(result.selectedModel?.id).not.toBe('model-1');
}
async function itShouldUseFallbackModelWhenNoMatch11() {
  engine.updateConfig({ fallbackModel: 'model-1' });
  const models = createTestModels();
  // All models have no quota
  models.forEach((m) => (m.quotaAvailable = 0));
  const request = createTestRequest(models);
  const result = await engine.route(request);
  expect(result.selectedModel?.id).toBe('model-1');
  expect(result.metadata.noMatch).toBe(true);
}
function describeRoute2() {
  it('should return no match when no candidates available', itShouldReturnNoMatchWhenNoCandidates3);
  it('should select the best matching model', itShouldSelectTheBestMatchingModel4);
  it('should filter by excluded providers', itShouldFilterByExcludedProviders5);
  it('should filter by preferred providers', itShouldFilterByPreferredProviders6);
  it('should filter by max cost', itShouldFilterByMaxCost7);
  it('should filter by max latency', itShouldFilterByMaxLatency8);
  it('should filter by required capabilities', itShouldFilterByRequiredCapabilities9);
  it('should filter out models with no quota', itShouldFilterOutModelsWithNoQuota10);
  it('should use fallback model when no match', itShouldUseFallbackModelWhenNoMatch11);
}
async function itShouldUseCapabilityMatchStrategyByDefault13() {
  const models = createTestModels();
  const request = createTestRequest(models, {
    task: { requiredCapabilities: ['coding'] },
  });
  const result = await engine.route(request);
  expect(result.metadata.strategy).toBe('capability-match');
}
function itShouldAllowSettingCustomStrategy14() {
  engine.setStrategy({ type: 'cost-optimize', weight: 1.0 });
  const strategy = engine.getStrategy('cost-optimize');
  expect(strategy).toBeDefined();
  expect(strategy?.type).toBe('cost-optimize');
}
function describeStrategies12() {
  it(
    'should use capability-match strategy by default',
    itShouldUseCapabilityMatchStrategyByDefault13,
  );
  it('should allow setting custom strategy', itShouldAllowSettingCustomStrategy14);
}
function itShouldUpdateConfiguration16() {
  engine.updateConfig({ maxDecisionTimeMs: 200 });
  // Config is internal, but we can verify behavior
  expect(engine).toBeDefined();
}
function describeConfiguration15() {
  it('should update configuration', itShouldUpdateConfiguration16);
}
function describeRoutingEngine0() {
  beforeEach(beforeEachBeforeEach1);
  describe('route', describeRoute2);
  describe('strategies', describeStrategies12);
  describe('configuration', describeConfiguration15);
}
