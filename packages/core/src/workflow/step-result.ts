import type { WorkflowStepResult, WorkflowStepStatus } from './types.js';

export function createStepResult({
  stepId,
  status,
  startTime,
  output,
  error,
}: CreateStepResultArgs): WorkflowStepResult {
  const endTime = Date.now();
  return {
    stepId,
    status,
    output,
    error,
    durationMs: endTime - startTime,
    startTime,
    endTime,
    retryCount: 0,
  };
}

type CreateStepResultArgs = {
  stepId: string;
  status: WorkflowStepStatus;
  startTime: number;
  output: Record<string, unknown> | undefined;
  error: Error | undefined;
};
