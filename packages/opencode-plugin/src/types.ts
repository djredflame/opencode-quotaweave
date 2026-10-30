/**
 * OpenCode Plugin types for QuotaWeave
 */

import type { CoreConfig, CoreContext } from '@opencode-quotaweave/core';

/**
 * Plugin configuration
 */
export interface PluginConfig extends CoreConfig {
  /** OpenCode-specific configuration */
  opencode?: OpenCodePluginConfig;
}

/**
 * OpenCode-specific plugin configuration
 */
export interface OpenCodePluginConfig {
  /** Enable automatic model routing */
  autoRoute?: boolean;
  /** Enable quota tracking */
  enableQuotaTracking?: boolean;
  /** Enable workflow execution */
  enableWorkflows?: boolean;
  /** Default workflow to execute */
  defaultWorkflow?: string;
}

/**
 * Plugin runtime context
 */
export interface PluginContext extends CoreContext {
  /** OpenCode session ID */
  opencodeSessionId: string;
  /** Current working directory */
  cwd: string;
  /** User configuration */
  userConfig: Record<string, unknown>;
  /** Plugin-specific metadata */
  pluginMetadata?: Record<string, unknown>;
  /** Unique request identifier */
  requestId: string;
  /** Timestamp when request was initiated */
  timestamp: number;
  /** User or session identifier */
  sessionId: string;
}

/**
 * Model selection request from OpenCode
 */
export interface ModelSelectionRequest {
  /** Task description */
  task: string;
  /** Required capabilities */
  requiredCapabilities?: string[];
  /** Preferred models */
  preferredModels?: string[];
  /** Excluded models */
  excludedModels?: string[];
  /** Maximum cost */
  maxCost?: number;
  /** Context */
  context: PluginContext;
}

/**
 * Model selection response
 */
export interface ModelSelectionResponse {
  /** Selected model ID */
  modelId: string;
  /** Provider ID */
  providerId: string;
  /** Selection reason */
  reason: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative models */
  alternatives: Array<{ modelId: string; providerId: string }>;
}

/**
 * Quota status response
 */
export interface QuotaStatusResponse {
  /** Per-model quota status */
  models: Record<string, ModelQuotaStatus>;
  /** Global quota status */
  global?: QuotaStatus;
}

/**
 * Model quota status
 */
export interface ModelQuotaStatus {
  /** Model ID */
  modelId: string;
  /** Provider ID */
  providerId: string;
  /** Used quota */
  used: number;
  /** Total quota */
  total: number;
  /** Remaining quota */
  remaining: number;
  /** Usage percentage */
  usagePercent: number;
  /** Is in warning state */
  isWarning: boolean;
  /** Is in critical state */
  isCritical: boolean;
  /** Is exhausted */
  isExhausted: boolean;
}

/**
 * Quota status
 */
export interface QuotaStatus {
  /** Used quota */
  used: number;
  /** Total quota */
  total: number;
  /** Remaining quota */
  remaining: number;
  /** Usage percentage */
  usagePercent: number;
}
