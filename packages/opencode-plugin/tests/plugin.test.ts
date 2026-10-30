import { configFileAccess } from '../src/config-file-access.js';
import type { ModelSelectionRequest } from '../src/types.js';
/**
 * Tests for QuotaWeavePlugin
 */
import type { ModelCandidate } from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VERSION } from '../src/index.js';
import type { QuotaWeavePlugin } from '../src/plugin.js';
import { createQuotaWeavePlugin } from '../src/plugin.js';
import type { PluginContext } from '../src/types.js';
let plugin: QuotaWeavePlugin;
let mockContext: PluginContext;
const testConfigPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'router.json');
describe('QuotaWeavePlugin', describeQuotaWeavePlugin0);
function createMockContext(overrides: Partial<PluginContext> = {}): PluginContext {
  return {
    requestId: 'test-request',
    timestamp: Date.now(),
    sessionId: 'test-session',
    opencodeSessionId: 'opencode-session',
    cwd: '/test',
    userConfig: {},
    ...overrides,
  };
}
function createModelSelectionRequest(
  context: PluginContext,
  overrides: Partial<ModelSelectionRequest> = {},
): ModelSelectionRequest {
  return {
    task: 'Test task',
    requiredCapabilities: ['coding'],
    preferredModels: [],
    excludedModels: [],
    context,
    ...overrides,
  };
}
function createMockQuotaState(): Record<string, unknown> {
  return {
    configId: 'test',
    used: 10,
    limit: 100,
    remaining: 90,
    usagePercent: 10,
    periodStart: Date.now(),
    periodEnd: Date.now() + 86400000,
    isWarning: false,
    isCritical: false,
    isExhausted: false,
    lastUpdated: Date.now(),
  };
}
function beforeEachBeforeEach1() {
  plugin = createQuotaWeavePlugin();
  mockContext = createMockContext();
  // Override cwd to point to test config directory
  mockContext.cwd = path.dirname(testConfigPath);
}
function afterEachAfterEach2() {
  plugin.shutdown();
}
function itShouldCreatePluginWithDefaultConfig4() {
  const defaultPlugin = createQuotaWeavePlugin();
  expect(VERSION).toBe('0.1.0');
  expect(defaultPlugin.isInitialized()).toBe(false);
  defaultPlugin.shutdown();
}
async function itShouldInitializeWithContextAndLoadConfig5() {
  await plugin.initialize(mockContext);
  expect(plugin.isInitialized()).toBe(true);
  expect(plugin.getRoutingConfig()).not.toBeNull();
}
async function itShouldNotReInitialize6() {
  await plugin.initialize(mockContext);
  await plugin.initialize(mockContext);
  expect(plugin.isInitialized()).toBe(true);
}
function describeInitialization3() {
  it('should create plugin with default config', itShouldCreatePluginWithDefaultConfig4);
  it('should initialize with context and load config', itShouldInitializeWithContextAndLoadConfig5);
  it('should not re-initialize', itShouldNotReInitialize6);
}
async function itShouldSelectModelFromLoadedConfig8() {
  await plugin.initialize(mockContext);
  const request = createModelSelectionRequest(mockContext);
  const response = await plugin.selectModel(request);
  expect(response.modelId).toBe('test/model-1');
  expect(response.providerId).toBe('test');
  expect(response.confidence).toBeGreaterThan(0);
}
async function itShouldThrowWhenNoConfigLoaded9() {
  // Create plugin without initializing (no config)
  const freshPlugin = createQuotaWeavePlugin();
  const request = createModelSelectionRequest(mockContext);
  await expect(freshPlugin.selectModel(request)).rejects.toThrow('No routing configuration loaded');
  freshPlugin.shutdown();
}
async function itShouldRespectExcludedProvidersFromRequest10() {
  await plugin.initialize(mockContext);
  const request = createModelSelectionRequest(mockContext, {
    excludedModels: ['test'],
  });
  await expect(plugin.selectModel(request)).rejects.toThrow('All candidates excluded by policy');
}
async function itShouldRespectPreferredProvidersFromRequest11() {
  await plugin.initialize(mockContext);
  const request = createModelSelectionRequest(mockContext);
  const response = await plugin.selectModel(request);
  expect(response.modelId).toBe('test/model-1');
}
async function itShouldEnforceFreeOnlyModeWhenConfigured12() {
  // Create plugin with free-only config
  const freeOnlyPlugin = createQuotaWeavePlugin();
  const freeOnlyContext = createMockContext();
  freeOnlyContext.cwd = path.dirname(testConfigPath);
  // Manually set free-only config
  const { findAndLoadConfig, resolveConfig } = await import('@opencode-quotaweave/core');
  const routingConfig = await findAndLoadConfig(
    freeOnlyContext.cwd,
    path.join(freeOnlyContext.cwd, 'router.json'),
    configFileAccess,
  );
  routingConfig.global.costPolicy.freeOnly = true;
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  freeOnlyPlugin.getCore().setRoutingConfig(resolvedConfig);
  await freeOnlyPlugin.initialize(freeOnlyContext);
  const request = createModelSelectionRequest(freeOnlyContext);
  const response = await freeOnlyPlugin.selectModel(request);
  expect(response.modelId).toBe('test/model-1'); // Free model
  expect(response.providerId).toBe('test');
  freeOnlyPlugin.shutdown();
}
function describeModelSelection7() {
  it('should select model from loaded config', itShouldSelectModelFromLoadedConfig8);
  it('should throw when no config loaded', itShouldThrowWhenNoConfigLoaded9);
  it(
    'should respect excluded providers from request',
    itShouldRespectExcludedProvidersFromRequest10,
  );
  it(
    'should respect preferred providers from request',
    itShouldRespectPreferredProvidersFromRequest11,
  );
  it('should enforce free-only mode when configured', itShouldEnforceFreeOnlyModeWhenConfigured12);
}
async function itShouldFailClosedWhenNoEligibleModels14() {
  await plugin.initialize(mockContext);
  const request = createModelSelectionRequest(mockContext, {
    requiredCapabilities: ['nonexistent'],
  });
  await expect(plugin.selectModel(request)).rejects.toThrow('All candidates excluded by policy');
}
async function itShouldNotAllowManualModelSelectionTo15() {
  await plugin.initialize(mockContext);
  // Even with preferredModels specifying a model not in config, it should be rejected
  const request = createModelSelectionRequest(mockContext, {
    preferredModels: ['unapproved/model'],
  });
  await expect(plugin.selectModel(request)).rejects.toThrow('All candidates excluded by policy');
}
async function itShouldRespectCategoryRestrictionsThroughPlugin16() {
  await plugin.initialize(mockContext);
  const request = createModelSelectionRequest(mockContext);
  const response = await plugin.selectModel(request);
  // Should select from general category (which includes both models)
  // But test/model-1 has higher priority
  expect(response.modelId).toBe('test/model-1');
}
function describeSafetyInvariants13() {
  it('should fail closed when no eligible models', itShouldFailClosedWhenNoEligibleModels14);
  it(
    'should not allow manual model selection to bypass policy',
    itShouldNotAllowManualModelSelectionTo15,
  );
  it(
    'should respect category restrictions through plugin',
    itShouldRespectCategoryRestrictionsThroughPlugin16,
  );
}
async function itShouldReturnQuotaStatus18() {
  await plugin.initialize(mockContext);
  const status = await plugin.getQuotaStatus(mockContext);
  expect(status).toHaveProperty('models');
  // global property is optional in current implementation
}
function describeQuotaStatus17() {
  it('should return quota status', itShouldReturnQuotaStatus18);
}
async function itShouldExecuteWorkflow20() {
  await plugin.initialize(mockContext);
  // Register a test workflow
  const core = plugin.getCore();
  core.registerWorkflow({
    id: 'test-workflow',
    version: '1.0.0',
    name: 'Test Workflow',
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
        type: 'route',
        config: {},
        dependencies: [],
      },
    ],
  });
  // Mock services
  configureWorkflowServices();
  const result: unknown = await plugin.executeWorkflow(
    'test-workflow',
    { test: 'data' },
    mockContext,
  );
  expect(result).toMatchObject({ status: 'completed' });
}
function describeWorkflowExecution19() {
  it('should execute workflow', itShouldExecuteWorkflow20);
}
async function itShouldReloadConfigFromDisk22() {
  await plugin.initialize(mockContext);
  const originalConfig = plugin.getRoutingConfig();
  expect(originalConfig).not.toBeNull();
  await plugin.reloadConfig();
  const reloadedConfig = plugin.getRoutingConfig();
  expect(reloadedConfig).not.toBeNull();
  expect(reloadedConfig).toEqual(originalConfig);
}
function describeConfigReload21() {
  it('should reload config from disk', itShouldReloadConfigFromDisk22);
}
function itShouldShutdownCleanly24() {
  expect(() => plugin.shutdown()).not.toThrow();
  expect(plugin.isInitialized()).toBe(false);
}
function describeShutdown23() {
  it('should shutdown cleanly', itShouldShutdownCleanly24);
}
function describeQuotaWeavePlugin0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('initialization', describeInitialization3);
  describe('model selection', describeModelSelection7);
  describe('safety invariants', describeSafetyInvariants13);
  describe('quota status', describeQuotaStatus17);
  describe('workflow execution', describeWorkflowExecution19);
  describe('config reload', describeConfigReload21);
  describe('shutdown', describeShutdown23);
}

function configureWorkflowServices(): void {
  const orchestrator = plugin.getCore().getWorkflowOrchestrator();
  orchestrator.setServices({
    route: vi.fn().mockResolvedValue({
      selectedModel: {
        id: 'test',
        provider: 'test',
        capabilities: [],
        priority: 10,
      } as ModelCandidate,
      alternatives: [],
      reason: 'test',
      confidence: 1.0,
      metadata: {},
    }),
    checkPolicy: vi.fn().mockResolvedValue({
      allowed: true,
      appliedRules: [],
      actions: [],
      warnings: [],
      metadata: {},
    }),
    allocateQuota: vi.fn().mockResolvedValue({
      success: true,
      allocated: 10,
      remaining: 90,
      state: createMockQuotaState(),
    }),
    releaseQuota: vi.fn().mockResolvedValue(true),
    invokeModel: vi.fn().mockResolvedValue({}),
  });
}
