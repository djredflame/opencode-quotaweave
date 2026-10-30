import type { QuotaWeaveCore } from '../src/core.js';
import type { RouteRequest } from '../src/routing/types.js';
import { configFileAccess } from './config-file-access.js';
import { requiredItem, requiredRecord } from './required-item.js';
/**
 * Integration tests for QuotaWeaveCore
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQuotaWeaveCore } from '../src/core.js';
import { findAndLoadConfig, resolveConfig } from '../src/routing/config-loader.js';
import type { CoreContext } from '../src/types.js';

import * as path from 'node:path';
let core: QuotaWeaveCore;
const testConfigPath = path.join(__dirname, 'router.json');
function createTestContext(overrides: Partial<CoreContext> = {}): CoreContext {
  return {
    requestId: 'test-request',
    timestamp: Date.now(),
    sessionId: 'test-session',
    ...overrides,
  };
}
describe('QuotaWeaveCore', describeQuotaWeaveCore0);
async function beforeEachBeforeEach1() {
  core = createQuotaWeaveCore({ debug: true });
  const routingConfig = await findAndLoadConfig(
    path.dirname(testConfigPath),
    testConfigPath,
    configFileAccess,
  );
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  core.setRoutingConfig(resolvedConfig);
}
function afterEachAfterEach2() {
  core.shutdown();
}
async function itShouldRouteThroughCoreUsingConfigRoutingEngine4() {
  const request: RouteRequest = {
    task: { type: 'coding', requiredCapabilities: ['coding'] },
    availableModels: [], // Models come from config, not request
    context: createTestContext(),
  };
  const result = await core.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('test/model-1');
}
async function itShouldFailClosedWhenNoConfigurationLoaded5() {
  const freshCore = createQuotaWeaveCore({ debug: true });
  // Don't load config - should fail closed
  const request: RouteRequest = {
    task: { type: 'coding', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await freshCore.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noConfig).toBe(true);
  freshCore.shutdown();
}
async function itShouldSelectFreeModelFromGeneralCategory6() {
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('test/model-1');
  expect(result.metadata.category).toBe('general');
}
async function itShouldRespectCategoryRestrictions7() {
  const request: RouteRequest = {
    task: { type: 'coding', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  expect(result.selectedModel).not.toBeNull();
  // coding category only has test/model-1
  expect(result.selectedModel?.id).toBe('test/model-1');
  expect(result.metadata.category).toBe('coding');
}
async function itShouldRejectDisabledModels8() {
  // Create core with config that has a disabled model
  const disabledConfigPath = path.join(__dirname, 'router.json');
  const routingConfig = await findAndLoadConfig(
    path.dirname(disabledConfigPath),
    disabledConfigPath,
    configFileAccess,
  );
  // Add a disabled model to the config
  routingConfig.global.models.push({
    id: 'test/disabled-model',
    provider: 'test',
    displayName: 'Disabled Model',
    capabilities: ['coding'],
    priority: 200, // Higher priority than test/model-1
    costClassification: 'free',
    estimatedCostPer1kTokens: 0,
    estimatedLatencyMs: 100,
    enabled: false,
    fallbacks: [],
  });
  requiredItem(routingConfig.global.categories, 0).modelIds.push('test/disabled-model');
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  const testCore = createQuotaWeaveCore({ debug: true });
  testCore.setRoutingConfig(resolvedConfig);
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await testCore.route(request);
  // Should not select disabled model even though it has higher priority
  expect(result.selectedModel?.id).not.toBe('test/disabled-model');
  expect(result.selectedModel?.id).toBe('test/model-1');
  testCore.shutdown();
}
async function itShouldRespectExcludedProvidersFromRequest9() {
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'], excludedProviders: ['test'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  // All models in config are from 'test' provider, so no match
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noMatch).toBe(true);
}
async function itShouldRespectPreferredProvidersFromRequest10() {
  // Add a model from a different provider
  const routingConfig = await findAndLoadConfig(
    path.dirname(testConfigPath),
    testConfigPath,
    configFileAccess,
  );
  routingConfig.global.models.push({
    id: 'other/model-1',
    provider: 'other',
    displayName: 'Other Model',
    capabilities: ['coding'],
    priority: 50,
    costClassification: 'free',
    estimatedCostPer1kTokens: 0,
    estimatedLatencyMs: 300,
    enabled: true,
    fallbacks: [],
  });
  requiredItem(routingConfig.global.categories, 0).modelIds.push('other/model-1');
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  const testCore = createQuotaWeaveCore({ debug: true });
  testCore.setRoutingConfig(resolvedConfig);
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'], preferredProviders: ['other'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await testCore.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('other/model-1');
  expect(result.selectedModel?.provider).toBe('other');
  testCore.shutdown();
}
async function itShouldRespectMaxCostFromRequest11() {
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'], maxCost: 0 }, // Only free models
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('test/model-1'); // Free model
}
async function itShouldReturnStructuredRefusalWhenNoEligible12() {
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['nonexistent'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noMatch).toBe(true);
  expect(result.metadata.rejectionReasons).toBeDefined();
}
async function itShouldNotSilentlyFallbackToUnapprovedModel13() {
  // This test verifies ADR-003: model failure stops and requires replanning
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['nonexistent'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await core.route(request);
  // Should fail closed, not fall back to any model
  expect(result.selectedModel).toBeNull();
  expect(result.metadata.noMatch).toBe(true);
  expect(result.metadata.rejectionReasons).toBeDefined();
  const reasons = requiredRecord(result.metadata.rejectionReasons);
  for (const value of Object.values(reasons)) {
    expect(value).toBeInstanceOf(Array);
    expect(value).not.toHaveLength(0);
  }
}
function describeRoutingIntegration3() {
  it(
    'should route through core using ConfigRoutingEngine',
    itShouldRouteThroughCoreUsingConfigRoutingEngine4,
  );
  it(
    'should fail closed when no configuration loaded',
    itShouldFailClosedWhenNoConfigurationLoaded5,
  );
  it('should select free model from general category', itShouldSelectFreeModelFromGeneralCategory6);
  it('should respect category restrictions', itShouldRespectCategoryRestrictions7);
  it('should reject disabled models', itShouldRejectDisabledModels8);
  it(
    'should respect excluded providers from request',
    itShouldRespectExcludedProvidersFromRequest9,
  );
  it(
    'should respect preferred providers from request',
    itShouldRespectPreferredProvidersFromRequest10,
  );
  it('should respect max cost from request', itShouldRespectMaxCostFromRequest11);
  it(
    'should return structured refusal when no eligible models',
    itShouldReturnStructuredRefusalWhenNoEligible12,
  );
  it(
    'should not silently fallback to unapproved model on failure',
    itShouldNotSilentlyFallbackToUnapprovedModel13,
  );
}
function describeQuotaWeaveCore0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('routing integration', describeRoutingIntegration3);
}
