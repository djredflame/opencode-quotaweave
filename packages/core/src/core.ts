/**
 * QuotaWeave Core
 *
 * Main entry point that integrates policy, routing, quota, and workflow engines.
 */

import type { PolicyEngine } from './policy/engine.js';
import { createDefaultPolicyEngine } from './policy/engine.js';
import type { PolicyDecision } from './policy/types.js';
import type { QuotaManager } from './quota/manager.js';
import { createDefaultQuotaManager } from './quota/manager.js';
import type { QuotaAllocation } from './quota/types.js';
import type { ConfigRoutingEngine } from './routing/config-engine.js';
import { createConfigRoutingEngine } from './routing/config-engine.js';
import { modelToCandidate } from './routing/config-model-to-candidate.js';
import type {
  ConfigRouteRequest,
  ConfigRouteResult,
  ResolvedRoutingConfig,
  RoutingRuntimeState,
} from './routing/config.js';
import type { ModelCandidate, RouteRequest, RouteResult } from './routing/types.js';
import type { CoreConfig, CoreContext } from './types.js';
import type { WorkflowOrchestrator } from './workflow/orchestrator.js';
import { createDefaultWorkflowOrchestrator } from './workflow/orchestrator.js';
import type {
  Workflow,
  WorkflowContext,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
} from './workflow/types.js';

/**
 * QuotaWeave Core - main integration class
 */
export class QuotaWeaveCore {
  private readonly policyEngine: PolicyEngine;
  private readonly configRoutingEngine: ConfigRoutingEngine;
  private readonly quotaManager: QuotaManager;
  private readonly workflowOrchestrator: WorkflowOrchestrator;
  private resolvedRoutingConfig: ResolvedRoutingConfig | null = null;
  private routingRuntimeState: RoutingRuntimeState = {
    cooldowns: {},
    providerErrors: {},
    lastUpdated: Date.now(),
  };

  constructor(config: CoreConfig = {}) {
    this.policyEngine = createDefaultPolicyEngine();
    this.configRoutingEngine = createConfigRoutingEngine(
      // Will be updated when config is loaded; provide minimal default for type safety
      {
        models: [],
        categories: [],
        defaultCategory: 'general',
        defaultStrategy: 'capability-match',
        strategyWeights: {
          'capability-match': 0.5,
          'cost-optimize': 0.1,
          'latency-optimize': 0.1,
          'quota-aware': 0.1,
          'priority-based': 0.2,
          'round-robin': 0.0,
          custom: 0.0,
        },
        costPolicy: {
          freeOnly: false,
          maxCostPerRequest: 0.5,
          maxCostPerSession: 10.0,
          warnThreshold: 0.8,
          budgetPeriodHours: 24,
        },
        cooldownConfig: {
          enabled: true,
          defaultCooldownMs: 60000,
          maxCooldownMs: 3600000,
          backoffMultiplier: 2.0,
          resetOnSuccess: true,
        },
        shadowMode: {
          enabled: false,
          logDecisions: true,
          sampleRate: 0.1,
        },
      },
    );
    this.quotaManager = createDefaultQuotaManager();
    this.workflowOrchestrator = createDefaultWorkflowOrchestrator();

    // Wire workflow services
    this.workflowOrchestrator.setServices({
      route: this.route.bind(this),
      checkPolicy: this.checkPolicy.bind(this),
      allocateQuota: this.allocateQuota.bind(this),
      releaseQuota: this.releaseQuota.bind(this),
      invokeModel: this.invokeModel.bind(this),
    });

    void config; // Acknowledge config for future use
  }

  /**
   * Load and set the resolved routing configuration
   * This must be called before routing requests to enforce safety policies
   */
  setRoutingConfig(resolvedConfig: ResolvedRoutingConfig): void {
    this.resolvedRoutingConfig = resolvedConfig;
    this.configRoutingEngine.updateConfig(resolvedConfig);
  }

  /**
   * Get the current resolved routing configuration
   */
  getRoutingConfig(): ResolvedRoutingConfig | null {
    return this.resolvedRoutingConfig;
  }

  /**
   * Get the config routing engine (authoritative)
   */
  getConfigRoutingEngine(): ConfigRoutingEngine {
    return this.configRoutingEngine;
  }

  /**
   * Get policy engine
   */
  getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  /**
   * Get quota manager
   */
  getQuotaManager(): QuotaManager {
    return this.quotaManager;
  }

  /**
   * Get workflow orchestrator
   */
  getWorkflowOrchestrator(): WorkflowOrchestrator {
    return this.workflowOrchestrator;
  }

  /**
   * Get current routing runtime state
   */
  getRoutingRuntimeState(): RoutingRuntimeState {
    return this.routingRuntimeState;
  }

  /**
   * Update routing runtime state (e.g., after model failures)
   */
  updateRoutingRuntimeState(state: Partial<RoutingRuntimeState>): void {
    this.routingRuntimeState = { ...this.routingRuntimeState, ...state, lastUpdated: Date.now() };
  }

  /**
   * Check policy for a request
   */
  async checkPolicy(context: WorkflowContext): Promise<PolicyDecision> {
    return Promise.resolve(
      this.policyEngine.evaluate({
        task: context.input,
        models: [],
        quota: { models: {}, global: { used: 0, total: 100, periodEnd: Date.now() + 3600000 } },
        session: { sessionId: context.coreContext.sessionId ?? 'unknown', tags: [] },
      }),
    );
  }

  /**
   * Route a request to the best model using ConfigRoutingEngine (authoritative)
   * Enforces user-controlled allowlist and safety policies
   */
  async route(request: RouteRequest): Promise<RouteResult> {
    if (!this.resolvedRoutingConfig) {
      // No configuration loaded - fail closed for safety
      return Promise.resolve({
        selectedModel: null,
        alternatives: [],
        reason: 'No routing configuration loaded. Cannot select model without validated allowlist.',
        confidence: 0,
        metadata: {
          noConfig: true,
          requestId: request.context.requestId,
        },
      });
    }

    // Convert RouteRequest to ConfigRouteRequest - only include defined properties
    const configRequest: ConfigRouteRequest = {
      task: request.task.description ?? request.task.type,
      context: request.context,
      resolvedConfig: this.resolvedRoutingConfig,
      runtimeState: this.routingRuntimeState,
    };

    // Only add optional properties if they have values
    if (request.task.requiredCapabilities && request.task.requiredCapabilities.length > 0) {
      configRequest.requiredCapabilities = request.task.requiredCapabilities;
    }
    const { result: configResult, updatedRuntimeState } = this.buildConfigRouteRequest(
      request,
      configRequest,
    );

    // Update runtime state (e.g., Round Robin rotation)
    this.routingRuntimeState = updatedRuntimeState;

    // Convert ConfigRouteResult to RouteResult for backward compatibility
    return Promise.resolve({
      selectedModel: configResult.selectedModel,
      alternatives: configResult.alternatives,
      reason: configResult.reason,
      confidence: configResult.confidence,
      metadata: {
        ...configResult.metadata,
        rejectionReasons: configResult.rejectionReasons,
      },
    });
  }

  private buildConfigRouteRequest(request: RouteRequest, configRequest: ConfigRouteRequest) {
    if (request.task.preferredProviders && request.task.preferredProviders.length > 0) {
      configRequest.preferredProviders = request.task.preferredProviders;
    }
    if (request.task.excludedProviders && request.task.excludedProviders.length > 0) {
      configRequest.excludedProviders = request.task.excludedProviders;
    }
    if (request.task.maxCost !== undefined) {
      configRequest.maxCost = request.task.maxCost;
    }
    if (request.task.maxLatencyMs !== undefined) {
      configRequest.maxLatencyMs = request.task.maxLatencyMs;
    }
    if (request.task.priority !== undefined) {
      configRequest.priority = request.task.priority;
    }
    if (request.task.type !== 'general') {
      configRequest.category = request.task.type;
    }

    const routeResult = this.configRoutingEngine.route(configRequest);
    return routeResult;
  }

  /**
   * Simulate a routing decision (pure, no side effects, no LLM calls)
   * Does NOT mutate runtime state (including Round Robin rotation)
   */
  async simulateRouting(
    request: Omit<ConfigRouteRequest, 'resolvedConfig' | 'runtimeState'>,
    runtimeState?: RoutingRuntimeState,
  ): Promise<ConfigRouteResult> {
    if (!this.resolvedRoutingConfig) {
      throw new Error('No routing configuration loaded. Load configuration before simulating.');
    }
    // Use simulate method which doesn't mutate state
    // Convert to SimulationRequest format (omit resolvedConfig, runtimeState, context)
    const { context: _context, ...simRequest } = request;
    const simResult = this.configRoutingEngine.simulate(
      simRequest,
      this.resolvedRoutingConfig,
      runtimeState ?? this.routingRuntimeState,
    );
    // Convert SimulationResult to ConfigRouteResult for backward compatibility
    const selectedModel = simResult.selectedModel
      ? modelToCandidate({ model: simResult.selectedModel.model })
      : null;
    const alternatives = simResult.candidates
      .filter((c) => !c.excluded && c.model.id !== simResult.selectedModel?.model.id)
      .slice(0, 3)
      .map((c) => modelToCandidate({ model: c.model }));
    return Promise.resolve({
      selectedModel,
      alternatives,
      reason: selectedModel
        ? `Simulation selected ${selectedModel.id}`
        : 'No model selected in simulation',
      confidence: simResult.selectedModel ? simResult.selectedModel.scoreBreakdown.totalScore : 0,
      rejectionReasons: Object.fromEntries(
        simResult.candidates
          .filter((c) => c.excluded && c.exclusionReasons.length > 0)
          .map((c) => [c.model.id, c.exclusionReasons]),
      ),
      metadata: {
        decisionTimeMs: simResult.metadata.decisionTimeMs,
        strategy: simResult.metadata.strategy,
        category: simResult.category,
        candidatesEvaluated: simResult.candidates.length,
        requestId: simResult.metadata.requestId,
      },
    });
  }

  /**
   * Allocate quota
   */
  async allocateQuota(
    configId: string,
    units: number,
    context: CoreContext,
    reserve?: boolean,
  ): Promise<QuotaAllocation> {
    const request: { configId: string; units: number; context: CoreContext; reserve?: boolean } = {
      configId,
      units,
      context,
    };
    if (reserve !== undefined) {
      request.reserve = reserve;
    }
    return Promise.resolve(this.quotaManager.allocate(request));
  }

  /**
   * Release quota reservation
   */
  async releaseQuota(configId: string, allocationId: string): Promise<boolean> {
    return Promise.resolve(this.quotaManager.releaseReservation(configId, allocationId));
  }

  /**
   * Invoke a model (placeholder - implemented by plugin/MCP server)
   */
  async invokeModel(
    _model: ModelCandidate,
    _input: unknown,
    _context: CoreContext,
  ): Promise<unknown> {
    void _model;
    void _input;
    void _context;
    // This is a placeholder - actual implementation provided by plugin/MCP server
    return Promise.resolve(
      Promise.reject(
        new Error('Model invocation not implemented in core. Use plugin or MCP server.'),
      ),
    );
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResult> {
    return Promise.resolve(this.workflowOrchestrator.execute(request));
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflowOrchestrator.registerWorkflow(workflow);
  }

  /**
   * Get core version
   */
  getVersion(): string {
    return '0.1.0';
  }

  /**
   * Shutdown all engines
   */
  shutdown(): void {
    this.quotaManager.shutdown();
    this.workflowOrchestrator.shutdown();
  }
}

/**
 * Create a default QuotaWeave core instance
 */
export function createQuotaWeaveCore(config?: CoreConfig): QuotaWeaveCore {
  return new QuotaWeaveCore(config);
}
