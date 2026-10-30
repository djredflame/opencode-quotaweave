import { expect, it, vi } from 'vitest';
import { executeParallelStep, executeSequentialStep } from '../src/workflow/nested-executors.js';
import { executeWithRetries } from '../src/workflow/retry-execution.js';
import { createStepResult } from '../src/workflow/step-result.js';
import type { WorkflowContext, WorkflowStep, WorkflowStepResult } from '../src/workflow/types.js';

function context(): WorkflowContext {
  return {
    workflowId: 'workflow',
    executionId: 'execution',
    coreContext: { requestId: 'request', timestamp: 1 },
    input: {},
    stepResults: {},
    variables: {},
    startTime: 1,
    status: 'running',
    error: undefined,
  };
}
function child(id: string): WorkflowStep {
  return { id, name: id, type: 'custom', config: {}, dependencies: [] };
}
function result(id: string, status: 'completed' | 'failed'): WorkflowStepResult {
  return createStepResult({
    stepId: id,
    status,
    startTime: Date.now(),
    output: status === 'completed' ? { value: id } : undefined,
    error: status === 'failed' ? new Error('failed') : undefined,
  });
}
it.each(['parallel', 'sequential'] as const)(
  'collects completed %s child outputs',
  async (type) => {
    const step: WorkflowStep = {
      ...child('parent'),
      type,
      config: { steps: [child('one'), child('two')] },
    };
    const execute = vi.fn<
      (step: WorkflowStep, context: WorkflowContext) => Promise<WorkflowStepResult>
    >((item) => Promise.resolve(result(item.id, 'completed')));
    const output = await (type === 'parallel' ? executeParallelStep : executeSequentialStep)(
      step,
      context(),
      execute,
    );
    expect(output.status).toBe('completed');
    expect(execute).toHaveBeenCalledTimes(2);
    expect(output.output).toEqual({
      [`${type}Results`]: { one: { value: 'one' }, two: { value: 'two' } },
    });
  },
);
it('stops sequential execution after a required failure and reports parallel failures', async () => {
  const step: WorkflowStep = {
    ...child('parent'),
    config: { steps: [child('one'), child('two')] },
  };
  const execute = vi.fn<
    (step: WorkflowStep, context: WorkflowContext) => Promise<WorkflowStepResult>
  >((item) => Promise.resolve(result(item.id, 'failed')));
  expect((await executeSequentialStep(step, context(), execute)).status).toBe('failed');
  expect(execute).toHaveBeenCalledTimes(1);
  execute.mockClear();
  expect((await executeParallelStep(step, context(), execute)).status).toBe('failed');
  expect(execute).toHaveBeenCalledTimes(2);
});
it('retries transient step failures through injected callbacks without sleeping in tests', async () => {
  const step = child('step');
  const state = context();
  const executeStep = vi
    .fn<() => Promise<WorkflowStepResult>>()
    .mockResolvedValueOnce(result('step', 'failed'))
    .mockResolvedValueOnce(result('step', 'completed'));
  const sleep = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const emitEvent = vi.fn();
  const completedSteps = new Set<string>();
  const output = await executeWithRetries({
    step,
    context: state,
    completedSteps,
    stepOutputs: {},
    workflow: { id: 'workflow', version: '1', name: 'Workflow', steps: [step] },
    runner: {
      executeStep,
      sleep,
      emitEvent,
      defaultRetry: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 },
    },
  });
  expect(output.status).toBe('completed');
  expect(executeStep).toHaveBeenCalledTimes(2);
  expect(sleep).toHaveBeenCalledWith(1);
  expect(emitEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'step_retried' }));
  expect(completedSteps.has('step')).toBe(true);
  expect(state.variables.step).toEqual({ value: 'step' });
});
