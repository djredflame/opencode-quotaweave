import type { PolicyDecision } from '../policy/types.js';
import type { QuotaAllocation } from '../quota/types.js';
import type { ModelCandidate, RouteRequest, RouteResult } from '../routing/types.js';
import type { CoreContext } from '../types.js';
import type { WorkflowContext, WorkflowStep, WorkflowStepResult } from './types.js';
export type StepExecutor = (
  step: WorkflowStep,
  context: WorkflowContext,
  services: WorkflowServices,
) => Promise<WorkflowStepResult>;

/**
 * Workflow services interface
 */
export interface WorkflowServices {
  route: (request: RouteRequest) => Promise<RouteResult>;
  checkPolicy: (context: WorkflowContext) => Promise<PolicyDecision>;
  allocateQuota: (
    configId: string,
    units: number,
    context: CoreContext,
  ) => Promise<QuotaAllocation>;
  releaseQuota: (configId: string, allocationId: string) => Promise<boolean>;
  invokeModel: (model: ModelCandidate, input: unknown, context: CoreContext) => Promise<unknown>;
}
