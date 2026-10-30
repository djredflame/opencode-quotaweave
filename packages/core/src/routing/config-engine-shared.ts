/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import type { ModelConfig, RoutingStrategyType } from './config.js';
import type { ScoreBreakdown } from './types.js';
export interface ScoredCandidate {
  model: ModelConfig;
  score: number;
  breakdown: ScoreBreakdown;
  excluded: boolean;
  exclusionReasons: string[];
}
export type StrategyWeightKeys =
  'capabilityMatch' | 'costScore' | 'latencyScore' | 'quotaScore' | 'priorityScore';
export const STRATEGY_WEIGHTS: Record<RoutingStrategyType, Record<StrategyWeightKeys, number>> = {
  'capability-match': {
    capabilityMatch: 0.5,
    costScore: 0.1,
    latencyScore: 0.1,
    quotaScore: 0.1,
    priorityScore: 0.2,
  },
  'cost-optimize': {
    capabilityMatch: 0.2,
    costScore: 0.5,
    latencyScore: 0.1,
    quotaScore: 0.1,
    priorityScore: 0.1,
  },
  'latency-optimize': {
    capabilityMatch: 0.2,
    costScore: 0.1,
    latencyScore: 0.5,
    quotaScore: 0.1,
    priorityScore: 0.1,
  },
  'quota-aware': {
    capabilityMatch: 0.2,
    costScore: 0.1,
    latencyScore: 0.1,
    quotaScore: 0.5,
    priorityScore: 0.1,
  },
  'priority-based': {
    capabilityMatch: 0.1,
    costScore: 0.1,
    latencyScore: 0.1,
    quotaScore: 0.1,
    priorityScore: 0.6,
  },
  'round-robin': {
    capabilityMatch: 0.2,
    costScore: 0.2,
    latencyScore: 0.2,
    quotaScore: 0.2,
    priorityScore: 0.2,
  },
  custom: {
    capabilityMatch: 0.3,
    costScore: 0.2,
    latencyScore: 0.2,
    quotaScore: 0.15,
    priorityScore: 0.15,
  },
};
