/**
 * OpenCode QuotaWeave Core
 *
 * Platform-agnostic routing and policy domain for intelligent
 * model selection, quota optimization, and workflow orchestration.
 *
 * @packageDocumentation
 */

export { QuotaWeaveCore, createQuotaWeaveCore } from './core.js';
export { PolicyEngine } from './policy/engine.js';
export type { Policy, PolicyDecision, PolicyRule } from './policy/types.js';
export { QuotaManager } from './quota/manager.js';
export type { QuotaAllocation, QuotaConfig, QuotaState } from './quota/types.js';
export { ConfigRoutingEngine, createConfigRoutingEngine } from './routing/config-engine.js';
export {
  ConfigLoadError,
  ConfigValidationException,
  createDefaultGlobalConfig,
  createDefaultProjectConfig,
  findAndLoadConfig,
  loadConfigFile,
  loadGlobalConfig,
  loadProjectConfig,
  resolveConfig,
  validateGlobalConfig,
  validateProjectConfig,
} from './routing/config-loader.js';
export { PREDEFINED_CATEGORIES } from './routing/config.js';
export type {
  CONFIG_SCHEMA_VERSION,
  ConfigValidationError,
  ConfigValidationResult,
  ConfigValidationWarning,
  CooldownConfig,
  CooldownInfo,
  CooldownState,
  CostPolicyConfig,
  GlobalRoutingConfig,
  ModelConfig,
  MultiAgentConfig,
  ProjectRoutingConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingCategoryId,
  RoutingConfig,
  RoutingRuntimeState,
  RoutingStrategyType,
  ShadowModeConfig,
  SimulationCandidate,
  SimulationMetadata,
  SimulationRequest,
  SimulationResult,
} from './routing/config.js';
export { RoutingEngine, createDefaultRoutingEngine } from './routing/engine.js';
export type {
  ConfigRouteRequest,
  ConfigRouteResult,
  ModelCandidate,
  RouteRequest,
  RouteResult,
  ScoreBreakdown,
} from './routing/types.js';
export type { ConfigFileAccess, CoreConfig, CoreContext } from './types.js';
export { WorkflowOrchestrator } from './workflow/orchestrator.js';
export type {
  Workflow,
  WorkflowContext,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
  WorkflowStep,
} from './workflow/types.js';

/**
 * Version of the core package
 */
export const VERSION = '0.1.0';
