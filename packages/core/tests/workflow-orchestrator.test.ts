import type { Mocked } from 'vitest';
import type { RouteResult } from '../src/routing/types.js';
import type { CoreContext } from '../src/types.js';
import type { WorkflowServices } from '../src/workflow/services.js';
/**
 * Tests for WorkflowOrchestrator
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PolicyDecision } from '../src/policy/types.js';
import type { QuotaAllocation } from '../src/quota/types.js';
import { WorkflowOrchestrator } from '../src/workflow/orchestrator.js';
import type { Workflow, WorkflowExecutionRequest } from '../src/workflow/types.js';
let orchestrator: WorkflowOrchestrator;
let mockServices: Mocked<WorkflowServices>;
function createTestWorkflow(): Workflow {
  return {
    id: 'test-workflow',
    version: '1.0.0',
    name: 'Test Workflow',
    steps: [
      {
        id: 'route-step',
        name: 'Route Step',
        type: 'route',
        config: {},
        dependencies: [],
      },
      {
        id: 'policy-step',
        name: 'Policy Step',
        type: 'policy-check',
        config: {},
        dependencies: ['route-step'],
      },
      {
        id: 'quota-step',
        name: 'Quota Step',
        type: 'quota-allocate',
        config: { configId: 'test-quota', units: 10 },
        dependencies: ['policy-step'],
      },
    ],
  };
}
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
describe('WorkflowOrchestrator', describeWorkflowOrchestrator0);
function beforeEachBeforeEach1() {
  orchestrator = new WorkflowOrchestrator();
  // Create mock services
  mockServices = {
    route: vi.fn<WorkflowServices['route']>(),
    checkPolicy: vi.fn<WorkflowServices['checkPolicy']>(),
    allocateQuota: vi.fn<WorkflowServices['allocateQuota']>(),
    releaseQuota: vi.fn<WorkflowServices['releaseQuota']>(),
    invokeModel: vi.fn<WorkflowServices['invokeModel']>(),
  };
  orchestrator.setServices(mockServices);
}
function afterEachAfterEach2() {
  orchestrator.shutdown();
}
function itShouldRegisterAValidWorkflow4() {
  const workflow = createTestWorkflow();
  orchestrator.registerWorkflow(workflow);
  expect(orchestrator.getWorkflow('test-workflow')).toEqual(workflow);
}
function itShouldThrowForInvalidWorkflow5() {
  const workflow = {
    id: '',
    version: '1.0.0',
    name: 'Test',
    steps: [],
  } as Workflow;
  expect(() => orchestrator.registerWorkflow(workflow)).toThrow('Workflow must have a valid id');
}
function itShouldThrowForWorkflowWithInvalidStep6() {
  const workflow: Workflow = {
    id: 'test-workflow',
    version: '1.0.0',
    name: 'Test Workflow',
    steps: [
      {
        id: 'step-1',
        name: 'Invalid Step',
        type: 'invalid-type' as unknown as 'route',
        config: {},
        dependencies: [],
      },
    ],
  };
  expect(() => orchestrator.registerWorkflow(workflow)).toThrow('Invalid step type');
}
function describeRegisterWorkflow3() {
  it('should register a valid workflow', itShouldRegisterAValidWorkflow4);
  it('should throw for invalid workflow', itShouldThrowForInvalidWorkflow5);
  it('should throw for workflow with invalid step', itShouldThrowForWorkflowWithInvalidStep6);
}
async function itShouldExecuteASimpleWorkflow8() {
  const workflow = createTestWorkflow();
  orchestrator.registerWorkflow(workflow);
  mockServices.route.mockResolvedValue(createMockRouteResult());
  mockServices.checkPolicy.mockResolvedValue(createMockPolicyDecision());
  mockServices.allocateQuota.mockResolvedValue(createMockQuotaAllocation());
  const request: WorkflowExecutionRequest = {
    workflowId: 'test-workflow',
    input: { test: 'data' },
    context: createTestContext(),
  };
  const result = await orchestrator.execute(request);
  expect(result.status).toBe('completed');
  expect(result.stepResults['route-step']).toBeDefined();
  expect(result.stepResults['policy-step']).toBeDefined();
  expect(result.stepResults['quota-step']).toBeDefined();
}
async function itShouldFailWhenWorkflowNotFound9() {
  const request: WorkflowExecutionRequest = {
    workflowId: 'non-existent',
    input: {},
    context: createTestContext(),
  };
  await expect(orchestrator.execute(request)).rejects.toThrow('Workflow not found');
}
async function itShouldRespectMaxConcurrentWorkflows10() {
  const orchestratorLimited = new WorkflowOrchestrator({ maxConcurrentWorkflows: 1 });
  orchestratorLimited.setServices(mockServices);
  const workflow = createTestWorkflow();
  orchestratorLimited.registerWorkflow(workflow);
  mockServices.route.mockResolvedValue(createMockRouteResult());
  mockServices.checkPolicy.mockResolvedValue(createMockPolicyDecision());
  mockServices.allocateQuota.mockResolvedValue(createMockQuotaAllocation());
  const request: WorkflowExecutionRequest = {
    workflowId: 'test-workflow',
    input: {},
    context: createTestContext(),
  };
  // Start first execution (don't await)
  const promise1 = orchestratorLimited.execute(request);
  // Try to start second execution
  await expect(orchestratorLimited.execute(request)).rejects.toThrow(
    'Maximum concurrent workflows reached',
  );
  await promise1;
  orchestratorLimited.shutdown();
}
function describeExecute7() {
  it('should execute a simple workflow', itShouldExecuteASimpleWorkflow8);
  it('should fail when workflow not found', itShouldFailWhenWorkflowNotFound9);
  it('should respect max concurrent workflows', itShouldRespectMaxConcurrentWorkflows10);
}
function describeWorkflowOrchestrator0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('registerWorkflow', describeRegisterWorkflow3);
  describe('execute', describeExecute7);
}
