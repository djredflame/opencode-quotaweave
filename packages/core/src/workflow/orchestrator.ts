import { EventBus } from '../utils/events.js';
import { sleep } from '../utils/helpers.js';
import { buildExecutionOrder } from './execution-order.js';
import { finishExecution } from './execution-result.js';
import { executeParallelStep, executeSequentialStep } from './nested-executors.js';
import { executeWithRetries } from './retry-execution.js';
import {
  executeModelInvokeStep,
  executePolicyCheckStep,
  executeQuotaAllocateStep,
  executeQuotaReleaseStep,
  executeRouteStep,
} from './service-executors.js';
import type { StepExecutor, WorkflowServices } from './services.js';
import { createStepResult } from './step-result.js';
import { validateWorkflow } from './validation.js';
import { executeConditionStep, executeTransformStep } from './value-executors.js';
/**
 * Workflow Orchestrator for QuotaWeave
 *
 * Executes workflows with support for routing, policy checks, quota management,
 * and model invocation steps.
 */

import type {
  Workflow,
  WorkflowContext,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowExecutionOptions,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  WorkflowExecutionStatus,
  WorkflowOrchestratorConfig,
  WorkflowStep,
  WorkflowStepResult,
  WorkflowStepType,
} from './types.js';

/**
 * Default workflow orchestrator configuration
 */
const DEFAULT_CONFIG: Required<WorkflowOrchestratorConfig> = {
  maxConcurrentWorkflows: 10,
  defaultTimeoutMs: 5 * 60 * 1000, // 5 minutes
  enablePersistence: false,
  persistenceIntervalMs: 30 * 1000, // 30 seconds
  maxHistorySize: 1000,
  defaultRetry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
};

/**
 * Step executor function type
 */

/**
 * Workflow orchestrator
 */
export class WorkflowOrchestrator {
  private workflows: Map<string, Workflow> = new Map();
  private config: Required<WorkflowOrchestratorConfig>;
  private executors: Map<WorkflowStepType, StepExecutor> = new Map();
  private runningExecutions: Map<string, WorkflowContext> = new Map();
  private executionHistory: WorkflowExecutionResult[] = [];
  private events = new EventBus<WorkflowEvent>();
  private services: WorkflowServices | null = null;

  constructor(config: Partial<WorkflowOrchestratorConfig> = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerDefaultExecutors();
  }

  /**
   * Set workflow services (injected from plugin/MCP server)
   */
  setServices(services: WorkflowServices): void {
    this.services = services;
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    validateWorkflow(workflow);
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Unregister a workflow
   */
  unregisterWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /**
   * Get a workflow
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Execute a workflow
   */
  async execute(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${request.workflowId}`);
    }

    if (this.runningExecutions.size >= this.config.maxConcurrentWorkflows) {
      throw new Error('Maximum concurrent workflows reached');
    }

    const {
      context,
      executionId,
      startTime,
    }: { context: WorkflowContext; executionId: string; startTime: number } =
      this.beginExecution(request);

    try {
      // Execute workflow steps
      const result = await this.executeSteps(workflow, context, request.options);

      const endTime = Date.now();
      const executionResult: WorkflowExecutionResult = {
        executionId,
        workflowId: request.workflowId,
        status: result.status,
        output: result.output,
        error: result.error,
        durationMs: endTime - startTime,
        stepResults: context.stepResults,
        startTime,
        endTime,
      };

      this.addToHistory(executionResult);
      this.emitEvent({
        type: result.status === 'completed' ? 'workflow_completed' : 'workflow_failed',
        workflowId: request.workflowId,
        executionId,
        timestamp: endTime,
        data: { status: result.status, error: result.error?.message },
      });

      return executionResult;
    } finally {
      this.runningExecutions.delete(executionId);
    }
  }

  private beginExecution(request: WorkflowExecutionRequest) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    const context: WorkflowContext = {
      workflowId: request.workflowId,
      executionId,
      coreContext: request.context,
      input: request.input,
      stepResults: {},
      variables: { ...request.options?.variables },
      startTime,
      status: 'running',
      error: undefined,
    };

    this.runningExecutions.set(executionId, context);
    this.emitEvent({
      type: 'workflow_started',
      workflowId: request.workflowId,
      executionId,
      timestamp: startTime,
      data: { input: request.input },
    });
    return { context, executionId, startTime };
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    workflow: Workflow,
    context: WorkflowContext,
    options?: WorkflowExecutionOptions,
  ): Promise<{ status: WorkflowExecutionStatus; output?: Record<string, unknown>; error?: Error }> {
    const completedSteps = new Set<string>();
    const stepOutputs: Record<string, unknown> = {};
    let workflowError: Error | undefined;

    // Build execution order based on dependencies
    const executionOrder = buildExecutionOrder(workflow.steps);

    for (const step of executionOrder) {
      // Check abort signal
      if (options?.abortSignal?.aborted) {
        workflowError = new Error('Workflow aborted');
        context.status = 'cancelled';
        break;
      }

      // Check timeout
      if (Date.now() - context.startTime > (options?.timeoutMs ?? this.config.defaultTimeoutMs)) {
        workflowError = new Error('Workflow timeout');
        context.status = 'failed';
        break;
      }

      // Check dependencies
      const depsMet = step.dependencies.every((dep) => completedSteps.has(dep));
      if (!depsMet) {
        const result = await this.executeStep(step, context);
        context.stepResults[step.id] = result;
        continue;
      }

      // Execute step with retries
      const stepResult: WorkflowStepResult = await executeWithRetries({
        runner: this.retryRunner(),
        step: step,
        context: context,
        completedSteps: completedSteps,
        stepOutputs: stepOutputs,
        workflow: workflow,
      });

      if (stepResult.status === 'failed') {
        if (!step.optional) {
          workflowError = stepResult.error ?? new Error(`Step ${step.id} failed`);
          context.status = 'failed';
          break;
        } else {
          // Optional step failed, continue
          completedSteps.add(step.id);
        }
      }
    }

    return finishExecution(context, workflowError, stepOutputs);
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();
    const executor = this.executors.get(step.type);

    if (!executor) {
      return createStepResult({
        stepId: step.id,
        status: 'failed',
        startTime: startTime,
        output: undefined,
        error: new Error(`No executor for step type: ${step.type}`),
      });
    }

    this.emitStepStarted(context, step, startTime);

    try {
      const result = await executor(step, context, this.services!);
      this.emitEvent({
        type: result.status === 'completed' ? 'step_completed' : 'step_failed',
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        timestamp: Date.now(),
        data: { status: result.status, error: result.error?.message },
      });
      return result;
    } catch (error) {
      const endTime = Date.now();
      const stepError = error instanceof Error ? error : new Error(String(error));
      const result = createStepResult({
        stepId: step.id,
        status: 'failed',
        startTime: startTime,
        output: undefined,
        error: stepError,
      });
      this.emitEvent({
        type: 'step_failed',
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        timestamp: endTime,
        data: { error: stepError.message },
      });
      return result;
    }
  }

  private emitStepStarted(context: WorkflowContext, step: WorkflowStep, startTime: number) {
    this.emitEvent({
      type: 'step_started',
      workflowId: context.workflowId,
      executionId: context.executionId,
      stepId: step.id,
      timestamp: startTime,
      data: { stepType: step.type, config: step.config },
    });
  }

  /**
   * Register default step executors
   */
  private registerDefaultExecutors(): void {
    this.executors.set('route', executeRouteStep);
    this.executors.set('policy-check', executePolicyCheckStep);
    this.executors.set('quota-allocate', executeQuotaAllocateStep);
    this.executors.set('quota-release', executeQuotaReleaseStep);
    this.executors.set('model-invoke', executeModelInvokeStep);
    this.executors.set('transform', executeTransformStep);
    this.executors.set('condition', executeConditionStep);
    this.executors.set('parallel', (step, context) =>
      executeParallelStep(step, context, this.executeStep.bind(this)),
    );
    this.executors.set('sequential', (step, context) =>
      executeSequentialStep(step, context, this.executeStep.bind(this)),
    );
  }

  /**
   * Add execution to history
   */
  private addToHistory(result: WorkflowExecutionResult): void {
    this.executionHistory.unshift(result);
    if (this.executionHistory.length > this.config.maxHistorySize) {
      this.executionHistory.pop();
    }
  }

  /**
   * Get execution history
   */
  getHistory(limit?: number): WorkflowExecutionResult[] {
    return limit ? this.executionHistory.slice(0, limit) : [...this.executionHistory];
  }

  /**
   * Get running executions
   */
  getRunningExecutions(): WorkflowContext[] {
    return Array.from(this.runningExecutions.values());
  }

  /**
   * Subscribe to workflow events
   */
  on(eventType: WorkflowEventType, listener: (event: WorkflowEvent) => void): () => void {
    return this.events.on(eventType, listener);
  }

  /**
   * Emit workflow event
   */
  private emitEvent(event: WorkflowEvent): void {
    this.events.emit(event);
  }

  /**
   * Sleep utility
   */

  /**
   * Shutdown the orchestrator
   */
  private retryRunner() {
    return {
      defaultRetry: this.config.defaultRetry,
      executeStep: this.executeStep.bind(this),
      sleep,
      emitEvent: this.emitEvent.bind(this),
    };
  }

  shutdown(): void {
    this.runningExecutions.clear();
    this.events.clear();
  }
}

/**
 * Create a default workflow orchestrator
 */
export function createDefaultWorkflowOrchestrator(): WorkflowOrchestrator {
  return new WorkflowOrchestrator();
}
