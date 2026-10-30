/**
 * Workflow orchestrator types for QuotaWeave
 */

import type { CoreContext } from '../types.js';

/**
 * Workflow definition
 */
export interface Workflow {
  /** Unique workflow identifier */
  id: string;
  /** Workflow version */
  version: string;
  /** Human-readable name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Workflow metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  /** Unique step identifier */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Step type */
  type: WorkflowStepType;
  /** Step configuration */
  config: Record<string, unknown>;
  /** Step dependencies (step IDs that must complete first) */
  dependencies: string[];
  /** Whether step is optional */
  optional?: boolean;
  /** Timeout in ms */
  timeoutMs?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Step metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow step types
 */
export type WorkflowStepType =
  | 'route'
  | 'policy-check'
  | 'quota-allocate'
  | 'quota-release'
  | 'model-invoke'
  | 'transform'
  | 'condition'
  | 'parallel'
  | 'sequential'
  | 'custom';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Base delay in ms */
  baseDelayMs: number;
  /** Maximum delay in ms */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Retryable error types */
  retryableErrors?: string[];
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  /** Workflow identifier */
  workflowId: string;
  /** Execution identifier */
  executionId: string;
  /** Core context */
  coreContext: CoreContext;
  /** Workflow input data */
  input: Record<string, unknown>;
  /** Step results (stepId -> result) */
  stepResults: Record<string, WorkflowStepResult>;
  /** Workflow variables */
  variables: Record<string, unknown>;
  /** Execution start time */
  startTime: number;
  /** Execution status */
  status: WorkflowExecutionStatus;
  /** Error if failed */
  error: Error | undefined;
}

/**
 * Workflow step result
 */
export interface WorkflowStepResult {
  /** Step identifier */
  stepId: string;
  /** Step status */
  status: WorkflowStepStatus;
  /** Step output data */
  output: Record<string, unknown> | undefined;
  /** Error if failed */
  error: Error | undefined;
  /** Execution time in ms */
  durationMs: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Retry count */
  retryCount: number;
}

/**
 * Workflow execution status
 */
export type WorkflowExecutionStatus =
  'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

/**
 * Workflow step status
 */
export type WorkflowStepStatus =
  'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

/**
 * Workflow orchestrator configuration
 */
export interface WorkflowOrchestratorConfig {
  /** Maximum concurrent workflow executions */
  maxConcurrentWorkflows: number;
  /** Default workflow timeout in ms */
  defaultTimeoutMs: number;
  /** Enable workflow persistence */
  enablePersistence: boolean;
  /** Persistence interval in ms */
  persistenceIntervalMs: number;
  /** Maximum workflow history size */
  maxHistorySize: number;
  /** Default retry configuration */
  defaultRetry?: RetryConfig;
}

/**
 * Workflow execution request
 */
export interface WorkflowExecutionRequest {
  /** Workflow ID to execute */
  workflowId: string;
  /** Input data for workflow */
  input: Record<string, unknown>;
  /** Core context */
  context: CoreContext;
  /** Execution options */
  options?: WorkflowExecutionOptions;
}

/**
 * Workflow execution options
 */
export interface WorkflowExecutionOptions {
  /** Override workflow timeout */
  timeoutMs?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Custom variables */
  variables?: Record<string, unknown>;
  /** Abort signal */
  abortSignal?: AbortSignal;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  /** Execution identifier */
  executionId: string;
  /** Workflow identifier */
  workflowId: string;
  /** Final execution status */
  status: WorkflowExecutionStatus;
  /** Workflow output */
  output: Record<string, unknown> | undefined;
  /** Error if failed */
  error: Error | undefined;
  /** Total execution time in ms */
  durationMs: number;
  /** Step results */
  stepResults: Record<string, WorkflowStepResult>;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
}

/**
 * Workflow event for monitoring
 */
export interface WorkflowEvent {
  /** Event type */
  type: WorkflowEventType;
  /** Workflow identifier */
  workflowId: string;
  /** Execution identifier */
  executionId: string;
  /** Step identifier (if step-specific) */
  stepId?: string;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Workflow event types
 */
export type WorkflowEventType =
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'workflow_cancelled'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'step_retried';
