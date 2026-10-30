/**
 * Routing engine types for QuotaWeave
 */
import type { CoreContext } from '../types.js';
import type { ResolvedRoutingConfig, RoutingRuntimeState } from './config.js';
/**
 * Model candidate for routing
 */
export interface ModelCandidate {
  /** Model identifier */
  id: string;
  /** Provider name */
  provider: string;
  /** Model capabilities */
  capabilities: string[];
  /** Model priority (higher = preferred) */
  priority: number;
  /** Estimated cost per request */
  estimatedCost?: number;
  /** Estimated latency in ms */
  estimatedLatencyMs?: number;
  /** Current quota availability */
  quotaAvailable?: number;
  /** Model metadata */
  metadata?: Record<string, unknown>;
}
/**
 * Routing request
 */
export interface RouteRequest {
  /** Task or request description */
  task: {
    /** Task type identifier */
    type: string;
    /** Task description */
    description?: string;
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
    /** Task metadata */
    metadata?: Record<string, unknown>;
  };
  /** Available models */
  availableModels: ModelCandidate[];
  /** Core context */
  context: CoreContext;
}
/**
 * Routing result
 */
export interface RouteResult {
  /** Selected model */
  selectedModel: ModelCandidate | null;
  /** Alternative models (fallbacks) */
  alternatives: ModelCandidate[];
  /** Routing decision reason */
  reason: string;
  /** Routing confidence (0-1) */
  confidence: number;
  /** Routing metadata */
  metadata: Record<string, unknown>;
}
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
  | 'custom';
/**
 * Routing strategy configuration
 */
export interface RoutingStrategy {
  /** Strategy type */
  type: RoutingStrategyType;
  /** Strategy weight (for weighted strategies) */
  weight?: number;
  /** Strategy-specific configuration */
  config?: Record<string, unknown>;
}
/**
 * Routing engine configuration
 */
export interface RoutingEngineConfig {
  /** Default routing strategy */
  defaultStrategy?: RoutingStrategyType;
  /** Available strategies */
  strategies?: RoutingStrategy[];
  /** Enable capability-based matching */
  enableCapabilityMatching?: boolean;
  /** Maximum decision time in ms */
  maxDecisionTimeMs?: number;
  /** Fallback model if no match */
  fallbackModel?: string;
}
/**
 * Routing decision context (internal)
 */
export interface RoutingDecisionContext {
  request: RouteRequest;
  scoredCandidates: ScoredCandidate[];
  selectedStrategy: RoutingStrategyType;
}
/**
 * Scored model candidate
 */
export interface ScoredCandidate {
  candidate: ModelCandidate;
  score: number;
  breakdown: ScoreBreakdown;
}
/**
 * Score breakdown for explainability
 */
export interface ScoreBreakdown {
  capabilityMatch: number;
  costScore: number;
  latencyScore: number;
  quotaScore: number;
  priorityScore: number;
  customScores: Record<string, number>;
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
