import type {
  Workflow,
  WorkflowContext,
  WorkflowEvent,
  WorkflowOrchestratorConfig,
  WorkflowStep,
  WorkflowStepResult,
} from './types.js';

export async function executeWithRetries({
  step,
  context,
  completedSteps,
  stepOutputs,
  workflow,
  runner,
}: ExecuteWithRetriesArgs) {
  const retryConfig = step.retry ?? runner.defaultRetry;
  let stepResult: WorkflowStepResult | undefined;
  let attempts = 0;

  while (attempts <= retryConfig.maxAttempts) {
    stepResult = await runner.executeStep(step, context);
    context.stepResults[step.id] = stepResult;

    if (stepResult.status === 'completed') {
      completedSteps.add(step.id);
      if (stepResult.output) {
        stepOutputs[step.id] = stepResult.output;
        context.variables[step.id] = stepResult.output;
      }
      break;
    }

    if (stepResult.status === 'failed') {
      attempts++;
      if (attempts <= retryConfig.maxAttempts) {
        const delay = Math.min(
          retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempts - 1),
          retryConfig.maxDelayMs,
        );
        await runner.sleep(delay);
        runner.emitEvent({
          type: 'step_retried',
          workflowId: workflow.id,
          executionId: context.executionId,
          stepId: step.id,
          timestamp: Date.now(),
          data: { attempt: attempts, error: stepResult.error?.message },
        });
        continue;
      }
    }

    break;
  }
  if (!stepResult) throw new Error('Retry policy did not allow an attempt');
  return stepResult;
}

type ExecuteWithRetriesArgs = {
  runner: {
    defaultRetry: Required<WorkflowOrchestratorConfig>['defaultRetry'];
    executeStep: (step: WorkflowStep, context: WorkflowContext) => Promise<WorkflowStepResult>;
    sleep: (ms: number) => Promise<void>;
    emitEvent: (event: WorkflowEvent) => void;
  };
  step: WorkflowStep;
  context: WorkflowContext;
  completedSteps: Set<string>;
  stepOutputs: Record<string, unknown>;
  workflow: Workflow;
};
