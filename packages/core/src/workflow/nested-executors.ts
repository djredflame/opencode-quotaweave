import { createStepResult } from './step-result.js';
import type { WorkflowContext, WorkflowStep, WorkflowStepResult } from './types.js';

export async function executeParallelStep(
  step: WorkflowStep,
  context: WorkflowContext,
  executeStep: (step: WorkflowStep, context: WorkflowContext) => Promise<WorkflowStepResult>,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  const { steps: subSteps } = step.config as { steps: WorkflowStep[] };
  const results = await Promise.all(subSteps.map((s) => executeStep(s, context)));

  const allCompleted = results.every((r) => r.status === 'completed');
  const output = Object.fromEntries(results.map((r, i) => [subSteps[i]!.id, r.output ?? {}]));

  return createStepResult({
    stepId: step.id,
    status: allCompleted ? 'completed' : 'failed',
    startTime: startTime,
    output: { parallelResults: output },
    error: undefined,
  });
}

export async function executeSequentialStep(
  step: WorkflowStep,
  context: WorkflowContext,
  executeStep: (step: WorkflowStep, context: WorkflowContext) => Promise<WorkflowStepResult>,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  const { steps: subSteps } = step.config as { steps: WorkflowStep[] };
  const results: WorkflowStepResult[] = [];

  for (const subStep of subSteps) {
    const result = await executeStep(subStep, context);
    results.push(result);
    if (result.status === 'failed' && !subStep.optional) {
      break;
    }
  }

  const allCompleted = results.every((r) => r.status === 'completed');
  const output = Object.fromEntries(results.map((r, i) => [subSteps[i]!.id, r.output ?? {}]));

  return createStepResult({
    stepId: step.id,
    status: allCompleted ? 'completed' : 'failed',
    startTime: startTime,
    output: { sequentialResults: output },
    error: undefined,
  });
}
