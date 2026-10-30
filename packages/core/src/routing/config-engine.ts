/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { routeInternal } from './config-route-internal.js';
import { simulateInternal } from './config-simulate-internal.js';
import type {
  ConfigRouteRequest,
  ConfigRouteResult,
  ResolvedRoutingConfig,
  RoutingRuntimeState,
  SimulationRequest,
  SimulationResult,
} from './config.js';

/** Result of a routing operation including updated runtime state */
export interface RouteResultWithState {
  result: ConfigRouteResult;
  updatedRuntimeState: RoutingRuntimeState;
}

export class ConfigRoutingEngine {
  private resolvedConfig: ResolvedRoutingConfig;
  constructor(resolvedConfig: ResolvedRoutingConfig) {
    this.resolvedConfig = resolvedConfig;
  }
  /**
   * Update the resolved configuration
   */
  updateConfig(resolvedConfig: ResolvedRoutingConfig): void {
    this.resolvedConfig = resolvedConfig;
  }
  /**
   * Route a request using the configuration
   * Returns both the routing result and the updated runtime state (for Round Robin rotation)
   */
  route(request: ConfigRouteRequest): RouteResultWithState {
    // Use resolvedConfig from request if provided, otherwise use engine's config
    const resolvedConfig = request.resolvedConfig ?? this.resolvedConfig;
    const originalResolvedConfig = this.resolvedConfig;
    this.resolvedConfig = resolvedConfig;
    try {
      return routeInternal({
        resolvedConfig: this.resolvedConfig,
        request: request,
      });
    } finally {
      this.resolvedConfig = originalResolvedConfig;
    }
  }
  /**
   * Simulate a routing decision (pure, deterministic, no side effects)
   * Accepts optional resolvedConfig override and/or runtimeState
   * Does NOT mutate the provided runtimeState
   */
  simulate(
    request: SimulationRequest,
    resolvedConfigOrRuntimeState?: ResolvedRoutingConfig | RoutingRuntimeState,
    runtimeState?: RoutingRuntimeState,
  ): SimulationResult {
    // Handle backward compatibility: if second arg is ResolvedRoutingConfig, use it
    const resolvedConfig =
      resolvedConfigOrRuntimeState && 'models' in resolvedConfigOrRuntimeState
        ? resolvedConfigOrRuntimeState
        : this.resolvedConfig;
    const simRuntimeState =
      resolvedConfigOrRuntimeState && 'models' in resolvedConfigOrRuntimeState
        ? runtimeState
        : resolvedConfigOrRuntimeState;
    const startTime = Date.now();
    const requestId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    // Temporarily use the provided resolvedConfig
    const originalResolvedConfig = this.resolvedConfig;
    this.resolvedConfig = resolvedConfig;
    try {
      return simulateInternal({
        resolvedConfig: this.resolvedConfig,
        request: request,
        runtimeState: simRuntimeState,
        requestId: requestId,
        startTime: startTime,
      });
    } finally {
      this.resolvedConfig = originalResolvedConfig;
    }
  }
}
/**
 * Create a config routing engine from resolved configuration
 */
export function createConfigRoutingEngine(
  resolvedConfig: ResolvedRoutingConfig,
): ConfigRoutingEngine {
  return new ConfigRoutingEngine(resolvedConfig);
}
/**
 * Create a default config routing engine (for testing)
 */
export function createDefaultConfigRoutingEngine(): ConfigRoutingEngine {
  // This creates an engine with an empty config - tests should call updateConfig
  return new ConfigRoutingEngine({
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
      weighted: 0.0,
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
  });
}
