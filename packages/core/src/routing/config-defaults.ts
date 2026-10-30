/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import {
  CONFIG_SCHEMA_VERSION,
  type CooldownConfig,
  type CostPolicyConfig,
  type GlobalRoutingConfig,
  type MultiAgentConfig,
  type ProjectRoutingConfig,
  type RoutingStrategyType,
  type ShadowModeConfig,
} from './config.js';
export const DEFAULT_COST_POLICY: CostPolicyConfig = {
  freeOnly: false,
  maxCostPerRequest: 0.5,
  maxCostPerSession: 10.0,
  warnThreshold: 0.8,
  budgetPeriodHours: 24,
};
export const DEFAULT_COOLDOWN_CONFIG: CooldownConfig = {
  enabled: true,
  defaultCooldownMs: 60000,
  maxCooldownMs: 3600000,
  backoffMultiplier: 2.0,
  resetOnSuccess: true,
};
export const DEFAULT_SHADOW_MODE_CONFIG: ShadowModeConfig = {
  enabled: false,
  logDecisions: true,
  sampleRate: 0.1,
};
export const DEFAULT_MULTI_AGENT_CONFIG: MultiAgentConfig = {
  mode: 'manual',
  requirePreview: true,
  stopOnModelFailure: true,
  noParallelFsWrites: true,
  enforceAllowlists: true,
  previewNoQuotaConsumption: true,
  enforceGuards: true,
};
export const DEFAULT_STRATEGY_WEIGHTS = {
  'capability-match': 0.5,
  'cost-optimize': 0.1,
  'latency-optimize': 0.1,
  'quota-aware': 0.1,
  'priority-based': 0.2,
  'round-robin': 0.0,
  custom: 0.0,
} as const satisfies Record<RoutingStrategyType, number>;
export function createDefaultGlobalConfig(): GlobalRoutingConfig {
  return {
    version: CONFIG_SCHEMA_VERSION,
    models: [],
    categories: [],
    defaultCategory: 'general',
    defaultStrategy: 'capability-match',
    strategyWeights: { ...DEFAULT_STRATEGY_WEIGHTS },
    costPolicy: { ...DEFAULT_COST_POLICY },
    cooldownConfig: { ...DEFAULT_COOLDOWN_CONFIG },
    shadowMode: { ...DEFAULT_SHADOW_MODE_CONFIG },
    multiAgent: { ...DEFAULT_MULTI_AGENT_CONFIG },
    metadata: {},
  };
}
export function createDefaultProjectConfig(
  projectId: string,
  globalConfigVersion: string,
): ProjectRoutingConfig {
  return {
    version: CONFIG_SCHEMA_VERSION,
    projectId,
    globalConfigVersion,
    metadata: {},
  };
}
