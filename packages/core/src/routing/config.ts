import type { CoreContext } from '../types.js';
import type { ModelCandidate } from './types.js';
/**
 * Model routing configuration types for QuotaWeave
 *
 * This module defines the user-editable configuration for model routing.
 * The configuration is versioned and supports both global and project-specific settings.
 */
/**
 * Predefined routing category identifiers
 * These are the only valid category IDs - users cannot invent arbitrary categories
 */
export type RoutingCategoryId =
  | 'general'
  | 'coding'
  | 'reasoning'
  | 'planning'
  | 'debugging'
  | 'review'
  | 'testing'
  | 'quick'
  | 'documentation'
  | 'vision';
/**
 * Metadata for predefined categories
 */
export const PREDEFINED_CATEGORIES: Record<
  RoutingCategoryId,
  {
    name: string;
    description: string;
  }
> = {
  general: { name: 'General Purpose', description: 'Balanced routing for general tasks' },
  coding: { name: 'Software Development', description: 'Optimized for coding tasks' },
  reasoning: { name: 'Complex Reasoning', description: 'For tasks requiring deep reasoning' },
  planning: {
    name: 'Planning & Architecture',
    description: 'For planning and architectural decisions',
  },
  debugging: { name: 'Debugging', description: 'For debugging and troubleshooting' },
  review: { name: 'Code Review', description: 'For code review and analysis' },
  testing: { name: 'Testing', description: 'For test generation and validation' },
  quick: { name: 'Quick Response', description: 'Prioritize fastest response time' },
  documentation: { name: 'Documentation', description: 'For documentation generation and writing' },
  vision: { name: 'Vision & Multimodal', description: 'For image and multimodal tasks' },
};
/**
 * Configuration schema version
 * Increment when making breaking changes to the configuration format
 */
export const CONFIG_SCHEMA_VERSION = '1.0.0' as const;
/**
 * Routing strategy type
 */
export type RoutingStrategyType =
  | 'capability-match'
  | 'cost-optimize'
  | 'latency-optimize'
  | 'quota-aware'
  | 'priority-based'
  | 'round-robin'
  | 'weighted'
  | 'custom';
/**
 * Model cost classification
 */
export type CostClassification = 'free' | 'paid' | 'unknown';
/**
 * Model entry in the allowlist
 */
export interface ModelConfig {
  /** Unique model identifier (must match OpenCode provider model ID) */
  id: string;
  /** Provider name (e.g., 'anthropic', 'openai', 'google', 'openrouter') */
  provider: string;
  /** Human-readable display name */
  displayName?: string;
  /** Model capabilities/tags for routing */
  capabilities: string[];
  /** Model priority (higher = more preferred) */
  priority: number;
  /** Cost classification */
  costClassification: CostClassification;
  /** Estimated cost per 1k tokens (USD) */
  estimatedCostPer1kTokens?: number;
  /** Estimated latency in ms */
  estimatedLatencyMs?: number;
  /** Whether this model is enabled */
  enabled: boolean;
  /** Ordered fallback model IDs (used when this model is unavailable) */
  fallbacks?: string[];
  /** Model selection weight for weighted routing (default: 1.0, must be >= 0) */
  weight?: number;
  /** Model metadata */
  metadata?: Record<string, unknown>;
}
/**
 * Routing category configuration
 */
export interface RoutingCategoryConfig {
  /** Category identifier - must be one of the predefined RoutingCategoryId values */
  id: RoutingCategoryId;
  /** Human-readable name */
  name: string;
  /** Description of when to use this category */
  description?: string;
  /** Model IDs that belong to this category (subset of global allowlist) */
  modelIds: string[];
  /** Default routing strategy for this category */
  defaultStrategy?: RoutingStrategyType;
  /** Category-specific strategy weights (override global) */
  strategyWeights?: Record<RoutingStrategyType, number>;
  /** Whether this category is enabled */
  enabled: boolean;
  /** Category metadata */
  metadata?: Record<string, unknown>;
}
/**
 * Global routing configuration
 */
export interface GlobalRoutingConfig {
  /** Schema version for migration */
  version: string;
  /** Global model allowlist - authoritative source of allowed models */
  models: ModelConfig[];
  /** Routing categories */
  categories: RoutingCategoryConfig[];
  /** Default routing category */
  defaultCategory: string;
  /** Default routing strategy (used when category doesn't specify) */
  defaultStrategy: RoutingStrategyType;
  /** Global strategy weights */
  strategyWeights: Record<RoutingStrategyType, number>;
  /** Cost policy configuration */
  costPolicy: CostPolicyConfig;
  /** Cooldown configuration */
  cooldownConfig: CooldownConfig;
  /** Shadow mode configuration */
  shadowMode: ShadowModeConfig;
  /** Multi-agent settings (reserved for future) */
  multiAgent?: MultiAgentConfig;
  /** Configuration metadata */
  metadata?: Record<string, unknown>;
}
/**
 * Project-specific routing configuration
 * Can only RESTRICT global configuration, never expand it
 */
export interface ProjectRoutingConfig {
  /** Schema version for migration */
  version: string;
  /** Project identifier */
  projectId: string;
  /** Reference to global config version this project config is based on */
  globalConfigVersion: string;
  /** Restricted model allowlist (subset of global models) */
  models?: ModelConfig[];
  /** Restricted categories (subset of global categories) */
  categories?: RoutingCategoryConfig[];
  /** Override default category */
  defaultCategory?: string;
  /** Override default strategy */
  defaultStrategy?: RoutingStrategyType;
  /** Override strategy weights */
  strategyWeights?: Partial<Record<RoutingStrategyType, number>>;
  /** Override cost policy (can only be more restrictive) */
  costPolicy?: Partial<CostPolicyConfig>;
  /** Override cooldown config */
  cooldownConfig?: Partial<CooldownConfig>;
  /** Override shadow mode */
  shadowMode?: Partial<ShadowModeConfig>;
  /** Project metadata */
  metadata?: Record<string, unknown>;
}
/**
 * Cost policy configuration
 */
export interface CostPolicyConfig {
  /** Enforce free-only mode (never select paid or unknown models) */
  freeOnly: boolean;
  /** Maximum cost per request (USD) */
  maxCostPerRequest?: number;
  /** Maximum cost per session (USD) */
  maxCostPerSession?: number;
  /** Warn when cost exceeds threshold */
  warnThreshold?: number;
  /** Budget period in hours */
  budgetPeriodHours?: number;
}
/**
 * Cooldown configuration
 */
export interface CooldownConfig {
  /** Enable cooldown tracking */
  enabled: boolean;
  /** Default cooldown duration in ms after model error */
  defaultCooldownMs: number;
  /** Maximum cooldown duration in ms */
  maxCooldownMs: number;
  /** Cooldown multiplier for repeated failures */
  backoffMultiplier: number;
  /** Reset cooldown on successful request */
  resetOnSuccess: boolean;
}
/**
 * Shadow mode configuration
 */
export interface ShadowModeConfig {
  /** Enable shadow mode */
  enabled: boolean;
  /** Shadow mode model IDs to compare against */
  shadowModelIds?: string[];
  /** Log shadow mode decisions */
  logDecisions: boolean;
  /** Sample rate for shadow mode (0-1) */
  sampleRate: number;
}
/**
 * Multi-agent configuration (reserved for future)
 */
export interface MultiAgentConfig {
  /** Multi-agent mode: off | manual | auto */
  mode: 'off' | 'manual' | 'auto';
  /** Require explicit preview and confirmation for every multi-agent execution */
  requirePreview: boolean;
  /** Model failure stops execution and requires replanning */
  stopOnModelFailure: boolean;
  /** No parallel filesystem-writing agents by default */
  noParallelFsWrites: boolean;
  /** Delegated models must satisfy same allowlists */
  enforceAllowlists: boolean;
  /** Preview must not consume model quota */
  previewNoQuotaConsumption: boolean;
  /** Agent Mesh must not bypass Free-Only or Budget Guard */
  enforceGuards: boolean;
}
/**
 * Complete routing configuration (global + optional project override)
 */
export interface RoutingConfig {
  /** Global configuration (authoritative) */
  global: GlobalRoutingConfig;
  /** Project-specific overrides (optional, restrictive only) */
  project?: ProjectRoutingConfig;
}
/**
 * Resolved routing configuration (global merged with project restrictions)
 */
export interface ResolvedRoutingConfig {
  /** Merged model allowlist */
  models: ModelConfig[];
  /** Merged categories */
  categories: RoutingCategoryConfig[];
  /** Effective default category */
  defaultCategory: string;
  /** Effective default strategy */
  defaultStrategy: RoutingStrategyType;
  /** Effective strategy weights */
  strategyWeights: Record<RoutingStrategyType, number>;
  /** Effective cost policy */
  costPolicy: CostPolicyConfig;
  /** Effective cooldown config */
  cooldownConfig: CooldownConfig;
  /** Effective shadow mode */
  shadowMode: ShadowModeConfig;
  /** Effective multi-agent config */
  multiAgent?: MultiAgentConfig;
}
/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Validation errors */
  errors: ConfigValidationError[];
  /** Validation warnings */
  warnings: ConfigValidationWarning[];
}
/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** JSON path to the problematic property */
  path: string;
  /** Invalid value */
  value?: unknown;
}
/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  /** Warning code */
  code: string;
  /** Human-readable message */
  message: string;
  /** JSON path */
  path: string;
}
/**
 * Routing request with configuration resolution
 * This extends the basic RouteRequest with category-based routing
 */
export interface ConfigRouteRequest {
  /** Task description */
  task: string;
  /** Explicit category (optional) */
  category?: string;
  /** Required capabilities */
  requiredCapabilities?: string[];
  /** Preferred providers */
  preferredProviders?: string[];
  /** Excluded providers */
  excludedProviders?: string[];
  /** Maximum cost per request */
  maxCost?: number;
  /** Maximum latency in ms */
  maxLatencyMs?: number;
  /** Task priority */
  priority?: number;
  /** Core context */
  context: CoreContext;
  /** Resolved routing configuration */
  resolvedConfig: ResolvedRoutingConfig;
  /** Runtime state (cooldowns, etc.) */
  runtimeState?: RoutingRuntimeState;
}
/**
 * Enhanced routing result with rejection reasons for all excluded candidates
 */
export interface ConfigRouteResult {
  /** Selected model */
  selectedModel: ModelCandidate | null;
  /** Alternative models (fallbacks) */
  alternatives: ModelCandidate[];
  /** Routing decision reason */
  reason: string;
  /** Routing confidence (0-1) */
  confidence: number;
  /** Detailed rejection reasons for each excluded candidate */
  rejectionReasons: Record<string, string[]>;
  /** Routing metadata */
  metadata: Record<string, unknown>;
}
/**
 * Routing simulation request
 */
export interface SimulationRequest {
  /** Task description */
  task: string;
  /** Explicit category (optional - if not provided, will be inferred) */
  category?: string;
  /** Required capabilities */
  requiredCapabilities?: string[];
  /** Preferred providers */
  preferredProviders?: string[];
  /** Excluded providers */
  excludedProviders?: string[];
  /** Maximum cost per request */
  maxCost?: number;
  /** Maximum latency in ms */
  maxLatencyMs?: number;
  /** Cost policy override */
  costPolicy?: Partial<CostPolicyConfig>;
  /** Project ID for project-specific config */
  projectId?: string;
}
/**
 * Routing simulation result
 */
export interface SimulationResult {
  /** Detected or explicit category */
  category: string;
  /** Models considered */
  candidates: SimulationCandidate[];
  /** Selected model (null if no match) */
  selectedModel: SimulationCandidate | null;
  /** Cost policy applied */
  costPolicy: CostPolicyConfig;
  /** Active cooldowns */
  activeCooldowns: CooldownInfo[];
  /** Whether execution would be permitted */
  permitted: boolean;
  /** Rejection reason if not permitted */
  rejectionReason?: string;
  /** Simulation metadata */
  metadata: SimulationMetadata;
}
/**
 * Simulation candidate (model with scoring details)
 */
export interface SimulationCandidate {
  /** Model configuration */
  model: ModelConfig;
  /** Whether model was excluded */
  excluded: boolean;
  /** Exclusion reasons */
  exclusionReasons: string[];
  /** Score breakdown */
  scoreBreakdown: {
    capabilityMatch: number;
    costScore: number;
    latencyScore: number;
    quotaScore: number;
    priorityScore: number;
    totalScore: number;
  };
}
/**
 * Cooldown information
 */
export interface CooldownInfo {
  /** Model ID */
  modelId: string;
  /** Provider */
  provider: string;
  /** Cooldown expiry timestamp */
  expiresAt: number;
  /** Remaining cooldown in ms */
  remainingMs: number;
  /** Reason for cooldown */
  reason: string;
}
/**
 * Simulation metadata
 */
export interface SimulationMetadata {
  /** Simulation timestamp */
  timestamp: number;
  /** Request ID */
  requestId: string;
  /** Strategy used */
  strategy: RoutingStrategyType;
  /** Decision time in ms */
  decisionTimeMs: number;
  /** Whether heuristic was used for category detection */
  heuristicCategory?: boolean;
}
/**
 * Round Robin rotation state for a specific category
 */
export interface RoundRobinCategoryState {
  /** Index of the last selected model in the eligible candidates list */
  lastSelectedIndex: number;
  /** Ordered list of eligible model IDs at the time of last selection */
  eligibleModelIds: string[];
  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Weighted routing state for a specific category
 * Uses Smooth Weighted Round Robin algorithm
 */
export interface WeightedCategoryState {
  /** Current weight for each model (used by SWRR algorithm) */
  currentWeights: Record<string, number>;
  /** Ordered list of eligible model IDs at the time of last selection */
  eligibleModelIds: string[];
  /** Configured weights used to accumulate currentWeights (absent in legacy state) */
  weights?: Record<string, number>;
  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Runtime state (separate from user configuration)
 */
export interface RoutingRuntimeState {
  /** Model/provider cooldowns */
  cooldowns: Record<string, CooldownState>;
  /** Provider error observations */
  providerErrors: Record<string, ProviderErrorState>;
  /** Quota usage statistics (future) */
  quotaStats?: Record<string, QuotaStat>;
  /** Health statistics (future) */
  healthStats?: Record<string, HealthStat>;
  /** Round Robin rotation state per category */
  roundRobinState?: Record<string, RoundRobinCategoryState>;
  /** Weighted routing state per category */
  weightedState?: Record<string, WeightedCategoryState>;
  /** Last updated timestamp */
  lastUpdated: number;
}
/**
 * Cooldown state for a model
 */
export interface CooldownState {
  /** Model ID */
  modelId: string;
  /** Provider */
  provider: string;
  /** Cooldown expiry timestamp */
  expiresAt: number;
  /** Failure count */
  failureCount: number;
  /** Last failure timestamp */
  lastFailureAt: number;
  /** Last failure reason */
  lastFailureReason?: string;
}
/**
 * Provider error state
 */
export interface ProviderErrorState {
  /** Provider ID */
  provider: string;
  /** Error count in current window */
  errorCount: number;
  /** First error timestamp in window */
  windowStart: number;
  /** Last error timestamp */
  lastErrorAt: number;
  /** Last error message */
  lastErrorMessage?: string;
}
/**
 * Quota statistics (future)
 */
export interface QuotaStat {
  /** Model ID */
  modelId: string;
  /** Provider */
  provider: string;
  /** Requests in current period */
  requests: number;
  /** Tokens in current period */
  tokens: number;
  /** Cost in current period */
  cost: number;
  /** Period start */
  periodStart: number;
  /** Period end */
  periodEnd: number;
}
/**
 * Health statistics (future)
 */
export interface HealthStat {
  /** Model ID */
  modelId: string;
  /** Provider */
  provider: string;
  /** Success rate (0-1) */
  successRate: number;
  /** Average latency in ms */
  avgLatencyMs: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Last updated */
  lastUpdated: number;
}
