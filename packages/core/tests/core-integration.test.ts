import { createTestWorkflow } from './core-workflow-fixtures.js';
import type { QuotaWeaveCore } from '../src/core.js';
import type { PolicyDecision } from '../src/policy/types.js';
import type { QuotaAllocation } from '../src/quota/types.js';
import type { RouteRequest, RouteResult } from '../src/routing/types.js';
import type { WorkflowServices } from '../src/workflow/services.js';
import type { WorkflowContext } from '../src/workflow/types.js';
import { configFileAccess } from './config-file-access.js';
import { requiredItem, requiredValue } from './required-item.js';
/**
 * Integration tests for QuotaWeaveCore
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
function createMockRouteResult(): RouteResult {
  return {
    selectedModel: {
      id: 'test-model',
      provider: 'test-provider',
      capabilities: [],
      priority: 10,
    },
    alternatives: [],
    reason: 'Test route',
    confidence: 1.0,
    metadata: {},
  };
}
function createMockPolicyDecision(): PolicyDecision {
  return {
    allowed: true,
    denialReason: undefined,
    requiredApprovals: [],
    appliedRules: [],
    actions: [],
    warnings: [],
    metadata: {},
  };
}
function createMockQuotaAllocation(): QuotaAllocation {
  return {
    success: true,
    allocationId: undefined,
    error: undefined,
    allocated: 10,
    remaining: 90,
    state: {
      configId: 'test-quota',
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
    },
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
function itShouldCreateCoreWithDefaultConfig4() {
  const defaultCore = createQuotaWeaveCore();
  expect(defaultCore.getVersion()).toBe('0.1.0');
  defaultCore.shutdown();
}
function itShouldExposeAllEngines5() {
  expect(core.getPolicyEngine()).toBeDefined();
  expect(core.getConfigRoutingEngine()).toBeDefined();
  expect(core.getQuotaManager()).toBeDefined();
  expect(core.getWorkflowOrchestrator()).toBeDefined();
}
function describeInitialization3() {
  it('should create core with default config', itShouldCreateCoreWithDefaultConfig4);
  it('should expose all engines', itShouldExposeAllEngines5);
}
async function itShouldCheckPolicyThroughCore7() {
  const context: WorkflowContext = {
    workflowId: 'test',
    executionId: 'test',
    coreContext: {
      requestId: 'test-request',
      timestamp: Date.now(),
      sessionId: 'test-session',
    },
    input: { type: 'coding' },
    stepResults: {},
    variables: {},
    startTime: Date.now(),
    status: 'running',
    error: undefined,
  };
  const decision = await core.checkPolicy(context);
  expect(decision.allowed).toBe(true);
  expect(decision.metadata.policyId).toBe('default');
}
function describePolicyIntegration6() {
  it('should check policy through core', itShouldCheckPolicyThroughCore7);
}
async function itShouldEnforceFreeOnlyModeWhenConfigured9() {
  // Create config with freeOnly: true
  const routingConfig = await findAndLoadConfig(
    path.dirname(testConfigPath),
    testConfigPath,
    configFileAccess,
  );
  routingConfig.global.costPolicy.freeOnly = true;
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  const testCore = createQuotaWeaveCore({ debug: true });
  testCore.setRoutingConfig(resolvedConfig);
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await testCore.route(request);
  // Should only select free model (test/model-1)
  expect(result.selectedModel).not.toBeNull();
  expect(result.selectedModel?.id).toBe('test/model-1');
  testCore.shutdown();
}
async function itShouldRejectPaidModelsInFreeOnly10() {
  // Create config with only paid model and freeOnly: true
  const routingConfig = await findAndLoadConfig(
    path.dirname(testConfigPath),
    testConfigPath,
    configFileAccess,
  );
  routingConfig.global.models = [
    {
      id: 'test/paid-only',
      provider: 'test',
      displayName: 'Paid Only Model',
      capabilities: ['coding'],
      priority: 100,
      costClassification: 'paid',
      estimatedCostPer1kTokens: 0.003,
      estimatedLatencyMs: 500,
      enabled: true,
      fallbacks: [],
    },
  ];
  requiredItem(routingConfig.global.categories, 0).modelIds = ['test/paid-only'];
  routingConfig.global.costPolicy.freeOnly = true;
  const resolvedConfig = resolveConfig(routingConfig.global, routingConfig.project);
  const testCore = createQuotaWeaveCore({ debug: true });
  testCore.setRoutingConfig(resolvedConfig);
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'] },
    availableModels: [],
    context: createTestContext(),
  };
  const result = await testCore.route(request);
  // Should fail closed - no free models available
  expect(result.selectedModel).toBeNull();
  expect(result.confidence).toBe(0);
  expect(result.metadata.noMatch).toBe(true);
  testCore.shutdown();
}
async function itShouldNotAllowAvailableModelsInRequestTo11() {
  // Verify that route() ignores availableModels and uses config instead
  const request: RouteRequest = {
    task: { type: 'general', requiredCapabilities: ['coding'] },
    availableModels: [
      {
        id: 'unapproved/model',
        provider: 'unapproved',
        capabilities: ['coding'],
        priority: 100,
        estimatedCost: 0,
        estimatedLatencyMs: 100,
        quotaAvailable: 100,
      },
    ],
    context: createTestContext(),
  };
  // The route() method should ignore availableModels and use config
  const result = await core.route(request);
  expect(result.selectedModel?.id).toBe('test/model-1');
}
function describeSafetyInvariants8() {
  it('should enforce free-only mode when configured', itShouldEnforceFreeOnlyModeWhenConfigured9);
  it(
    'should reject paid models in free-only mode even if only match',
    itShouldRejectPaidModelsInFreeOnly10,
  );
  it(
    'should not allow availableModels in request to bypass policies',
    itShouldNotAllowAvailableModelsInRequestTo11,
  );
}
async function itShouldAllocateQuotaThroughCore13() {
  const allocation = await core.allocateQuota('default-quota', 10, createTestContext());
  // Default quota doesn't exist, should fail
  expect(allocation.success).toBe(false);
}
async function itShouldWorkWithRegisteredQuota14() {
  core.getQuotaManager().registerQuota({
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  });
  const allocation = await core.allocateQuota('test-quota', 10, createTestContext());
  expect(allocation.success).toBe(true);
  expect(allocation.allocated).toBe(10);
}
async function itShouldReleaseQuotaThroughCore15() {
  core.getQuotaManager().registerQuota({
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  });
  const allocation = await core.allocateQuota('test-quota', 10, createTestContext(), true);
  expect(allocation.allocationId).toBeDefined();
  const released = await core.releaseQuota('test-quota', requiredValue(allocation.allocationId));
  expect(released).toBe(true);
}
function describeQuotaIntegration12() {
  it('should allocate quota through core', itShouldAllocateQuotaThroughCore13);
  it('should work with registered quota', itShouldWorkWithRegisteredQuota14);
  it('should release quota through core', itShouldReleaseQuotaThroughCore15);
}
async function itShouldExecuteWorkflowThroughCore17() {
  const workflow = createTestWorkflow();
  core.registerWorkflow(workflow);
  // Mock the internal services
  const orchestrator = core.getWorkflowOrchestrator();
  const services: WorkflowServices = {
    route: vi.fn().mockResolvedValue(createMockRouteResult()),
    checkPolicy: vi.fn().mockResolvedValue(createMockPolicyDecision()),
    allocateQuota: vi.fn().mockResolvedValue(createMockQuotaAllocation()),
    releaseQuota: vi.fn().mockResolvedValue(true),
    invokeModel: vi.fn().mockResolvedValue({ result: 'ok' }),
  };
  orchestrator.setServices(services);
  const request = {
    workflowId: 'test-workflow',
    input: {},
    context: createTestContext(),
  };
  const result = await core.executeWorkflow(request);
  expect(result.status).toBe('completed');
}
function describeWorkflowIntegration16() {
  it('should execute workflow through core', itShouldExecuteWorkflowThroughCore17);
}
function itShouldShutdownAllEngines19() {
  expect(() => core.shutdown()).not.toThrow();
}
function describeShutdown18() {
  it('should shutdown all engines', itShouldShutdownAllEngines19);
}
function describeQuotaWeaveCore0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('initialization', describeInitialization3);
  describe('policy integration', describePolicyIntegration6);
  describe('safety invariants', describeSafetyInvariants8);
  describe('quota integration', describeQuotaIntegration12);
  describe('workflow integration', describeWorkflowIntegration16);
  describe('shutdown', describeShutdown18);
}
