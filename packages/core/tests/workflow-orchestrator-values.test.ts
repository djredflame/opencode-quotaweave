import type { Mocked } from 'vitest';
import type { RouteResult } from '../src/routing/types.js';
import type { CoreContext } from '../src/types.js';
import type { WorkflowServices } from '../src/workflow/services.js';
import type { WorkflowEvent } from '../src/workflow/types.js';
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
async function itShouldExecuteTransformStep4() {
  const workflow: Workflow = {
    id: 'transform-workflow',
    version: '1.0.0',
    name: 'Transform Workflow',
    steps: [
      {
        id: 'transform-step',
        name: 'Transform Step',
        type: 'transform',
        config: {
          transform: (input: unknown) => ({
            ...(input as Record<string, unknown>),
            transformed: true,
          }),
        },
        dependencies: [],
      },
    ],
  };
  orchestrator.registerWorkflow(workflow);
  const request: WorkflowExecutionRequest = {
    workflowId: 'transform-workflow',
    input: { original: 'data' },
    context: createTestContext(),
  };
  const result = await orchestrator.execute(request);
  expect(result.status).toBe('completed');
  expect(result.output?.['transform-step']).toEqual({
    transformed: { original: 'data', transformed: true },
  });
}
function describeTransformStep3() {
  it('should execute transform step', itShouldExecuteTransformStep4);
}
async function itShouldSkipStepWhenConditionIsFalse6() {
  const workflow: Workflow = {
    id: 'condition-workflow',
    version: '1.0.0',
    name: 'Condition Workflow',
    steps: [
      {
        id: 'condition-step',
        name: 'Condition Step',
        type: 'condition',
        config: {
          condition: () => false,
        },
        dependencies: [],
      },
      {
        id: 'next-step',
        name: 'Next Step',
        type: 'route',
        config: {},
        dependencies: ['condition-step'],
      },
    ],
  };
  orchestrator.registerWorkflow(workflow);
  mockServices.route.mockResolvedValue(createMockRouteResult());
  const request: WorkflowExecutionRequest = {
    workflowId: 'condition-workflow',
    input: {},
    context: createTestContext(),
  };
  const result = await orchestrator.execute(request);
  expect(result.status).toBe('completed');
  expect(result.stepResults['condition-step']?.status).toBe('skipped');
  expect(result.stepResults['next-step']?.status).toBe('completed');
}
function describeConditionStep5() {
  it('should skip step when condition is false', itShouldSkipStepWhenConditionIsFalse6);
}
async function itShouldEmitWorkflowEvents8() {
  const workflow = createTestWorkflow();
  orchestrator.registerWorkflow(workflow);
  mockServices.route.mockResolvedValue(createMockRouteResult());
  mockServices.checkPolicy.mockResolvedValue(createMockPolicyDecision());
  mockServices.allocateQuota.mockResolvedValue(createMockQuotaAllocation());
  const events: WorkflowEvent[] = [];
  orchestrator.on('workflow_started', (e) => events.push(e));
  orchestrator.on('workflow_completed', (e) => events.push(e));
  orchestrator.on('step_started', (e) => events.push(e));
  orchestrator.on('step_completed', (e) => events.push(e));
  const request: WorkflowExecutionRequest = {
    workflowId: 'test-workflow',
    input: {},
    context: createTestContext(),
  };
  await orchestrator.execute(request);
  expect(events.some((e) => e.type === 'workflow_started')).toBe(true);
  expect(events.some((e) => e.type === 'workflow_completed')).toBe(true);
  expect(events.filter((e) => e.type === 'step_started').length).toBe(3);
  expect(events.filter((e) => e.type === 'step_completed').length).toBe(3);
}
function describeEvents7() {
  it('should emit workflow events', itShouldEmitWorkflowEvents8);
}
function describeWorkflowOrchestrator0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('transform step', describeTransformStep3);
  describe('condition step', describeConditionStep5);
  describe('events', describeEvents7);
}
