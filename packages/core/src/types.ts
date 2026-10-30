/**
 * Core configuration and context types for QuotaWeave
 */

/**
 * Core configuration options
 */
export interface CoreConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Policy engine configuration */
  policy?: PolicyEngineConfig;
  /** Routing engine configuration */
  routing?: RoutingEngineConfig;
  /** Quota manager configuration */
  quota?: QuotaManagerConfig;
  /** Workflow orchestrator configuration */
  workflow?: WorkflowOrchestratorConfig;
}

/**
 * Policy engine configuration
 */
export interface PolicyEngineConfig {
  /** Default policy to apply when none matched */
  defaultPolicy?: string;
  /** Maximum policy evaluation depth */
  maxDepth?: number;
}

/**
 * Routing engine configuration
 */
export interface RoutingEngineConfig {
  /** Default model to use when no routing matches */
  defaultModel?: string;
  /** Enable model capability matching */
  enableCapabilityMatching?: boolean;
  /** Maximum routing decision time in ms */
  maxDecisionTimeMs?: number;
}

/**
 * Quota manager configuration
 */
export interface QuotaManagerConfig {
  /** Default quota period in hours */
  defaultPeriodHours?: number;
  /** Enable automatic quota replenishment */
  autoReplenish?: boolean;
  /** Warning threshold percentage (0-100) */
  warningThreshold?: number;
}

/**
 * Workflow orchestrator configuration
 */
export interface WorkflowOrchestratorConfig {
  /** Maximum concurrent workflows */
  maxConcurrentWorkflows?: number;
  /** Default workflow timeout in ms */
  defaultTimeoutMs?: number;
  /** Enable workflow persistence */
  enablePersistence?: boolean;
}

/**
 * Runtime context passed through the core system
 */
export interface CoreContext {
  /** Unique request identifier */
  requestId: string;
  /** Timestamp when request was initiated */
  timestamp: number;
  /** User or session identifier */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/** Runtime-provided access to configuration text; the domain does not depend on a filesystem. */
export interface ConfigFileAccess {
  readText(filePath: string): Promise<string>;
  exists(filePath: string): Promise<boolean>;
  join(...parts: string[]): string;
}
