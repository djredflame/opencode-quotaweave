import type { WorkflowContext, WorkflowExecutionStatus } from './types.js';
export function finishExecution(
  context: WorkflowContext,
  workflowError: Error | undefined,
  stepOutputs: Record<string, unknown>,
): { status: WorkflowExecutionStatus; output?: Record<string, unknown>; error?: Error } {
  context.status = workflowError ? 'failed' : 'completed';
  context.error = workflowError;

  if (workflowError) {
    return {
      status: context.status,
      error: workflowError,
    };
  }
  return {
    status: context.status,
    output: stepOutputs,
  };
}
