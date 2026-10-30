import type { ModelCandidate, RouteRequest } from '../routing/types.js';
import type { WorkflowServices } from './services.js';
import { createStepResult } from './step-result.js';
import type { WorkflowContext, WorkflowStep, WorkflowStepResult } from './types.js';

export async function executeRouteStep(
  step: WorkflowStep,
  _context: WorkflowContext,
  services: WorkflowServices,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  if (!services.route) {
    return createStepResult({
      stepId: step.id,
      status: 'failed',
      startTime: startTime,
      output: undefined,
      error: new Error('Route service not available'),
    });
  }

  const request = step.config as unknown as RouteRequest;
  const result = await services.route(request);

  return createStepResult({
    stepId: step.id,
    status: 'completed',
    startTime: startTime,
    output: { routeResult: result },
    error: undefined,
  });
}

export async function executePolicyCheckStep(
  step: WorkflowStep,
  context: WorkflowContext,
  services: WorkflowServices,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  if (!services.checkPolicy) {
    return createStepResult({
      stepId: step.id,
      status: 'failed',
      startTime: startTime,
      output: undefined,
      error: new Error('Policy check service not available'),
    });
  }

  const decision = await services.checkPolicy(context);

  return createStepResult({
    stepId: step.id,
    status: 'completed',
    startTime: startTime,
    output: { policyDecision: decision },
    error: undefined,
  });
}

export async function executeQuotaAllocateStep(
  step: WorkflowStep,
  context: WorkflowContext,
  services: WorkflowServices,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  if (!services.allocateQuota) {
    return createStepResult({
      stepId: step.id,
      status: 'failed',
      startTime: startTime,
      output: undefined,
      error: new Error('Quota allocate service not available'),
    });
  }

  const { configId, units } = step.config as { configId: string; units: number };
  const allocation = await services.allocateQuota(configId, units, context.coreContext);

  return createStepResult({
    stepId: step.id,
    status: allocation.success ? 'completed' : 'failed',
    startTime: startTime,
    output: {
      quotaAllocation: allocation,
    },
    error: undefined,
  });
}

export async function executeQuotaReleaseStep(
  step: WorkflowStep,
  _context: WorkflowContext,
  services: WorkflowServices,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  if (!services.releaseQuota) {
    return createStepResult({
      stepId: step.id,
      status: 'failed',
      startTime: startTime,
      output: undefined,
      error: new Error('Quota release service not available'),
    });
  }

  const { configId, allocationId } = step.config as { configId: string; allocationId: string };
  const success = await services.releaseQuota(configId, allocationId);

  return createStepResult({
    stepId: step.id,
    status: success ? 'completed' : 'failed',
    startTime: startTime,
    output: { released: success },
    error: undefined,
  });
}

export async function executeModelInvokeStep(
  step: WorkflowStep,
  context: WorkflowContext,
  services: WorkflowServices,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  if (!services.invokeModel) {
    return createStepResult({
      stepId: step.id,
      status: 'failed',
      startTime: startTime,
      output: undefined,
      error: new Error('Model invoke service not available'),
    });
  }

  const { model, input } = step.config as { model: ModelCandidate; input: unknown };
  const result = await services.invokeModel(model, input, context.coreContext);

  return createStepResult({
    stepId: step.id,
    status: 'completed',
    startTime: startTime,
    output: { modelResult: result },
    error: undefined,
  });
}
