import { createStepResult } from './step-result.js';
import type { WorkflowContext, WorkflowStep, WorkflowStepResult } from './types.js';

export async function executeTransformStep(
  step: WorkflowStep,
  context: WorkflowContext,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  const { transform } = step.config as {
    transform: (input: unknown, context: WorkflowContext) => unknown;
  };
  const input = step.config.input ?? context.input;
  const output = transform(input, context);

  return Promise.resolve(
    createStepResult({
      stepId: step.id,
      status: 'completed',
      startTime: startTime,
      output: { transformed: output },
      error: undefined,
    }),
  );
}

export async function executeConditionStep(
  step: WorkflowStep,
  context: WorkflowContext,
): Promise<WorkflowStepResult> {
  const startTime = Date.now();

  const { condition } = step.config as { condition: (context: WorkflowContext) => boolean };
  const result = condition(context);

  return Promise.resolve(
    createStepResult({
      stepId: step.id,
      status: result ? 'completed' : 'skipped',
      startTime: startTime,
      output: { conditionResult: result },
      error: undefined,
    }),
  );
}
