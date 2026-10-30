/**
 * QuotaWeave Routing Module
 *
 * Configuration-based model routing with simulation capabilities.
 */
export {
  ConfigRoutingEngine,
  createConfigRoutingEngine,
  createDefaultConfigRoutingEngine,
} from './config-engine.js';
export {
  ConfigLoadError,
  ConfigValidationException,
  createDefaultGlobalConfig,
  createDefaultProjectConfig,
  findAndLoadConfig,
  loadConfigFile,
  resolveConfig,
  validateGlobalConfig,
  validateProjectConfig,
} from './config-loader.js';
export {
  CONFIG_SCHEMA_VERSION,
  type ConfigRouteRequest,
  type ConfigRouteResult,
  type ConfigValidationError,
  type ConfigValidationResult,
  type ConfigValidationWarning,
  type CooldownConfig,
  type CooldownInfo,
  type CooldownState,
  type CostClassification,
  type CostPolicyConfig,
  type GlobalRoutingConfig,
  type ModelConfig,
  type MultiAgentConfig,
  type ProjectRoutingConfig,
  type ResolvedRoutingConfig,
  type RoutingCategoryConfig,
  type RoutingConfig,
  type RoutingRuntimeState,
  type RoutingStrategyType,
  type ShadowModeConfig,
  type SimulationCandidate,
  type SimulationMetadata,
  type SimulationRequest,
  type SimulationResult,
} from './config.js';
export { RoutingEngine, createDefaultRoutingEngine } from './engine.js';
export {
  type ModelCandidate,
  type RouteRequest,
  type RouteResult,
  type RoutingEngineConfig,
  type RoutingStrategy,
  type ScoreBreakdown,
  type ScoredCandidate,
} from './types.js';
