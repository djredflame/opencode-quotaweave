/** Internal routing operation; public API remains ConfigRoutingEngine. */
/**
 * Configuration-based Routing Engine for QuotaWeave
 *
 * Uses validated user configuration to make routing decisions.
 * Pure domain logic - no OpenCode, MCP, or filesystem dependencies.
 */
import { calculateBreakdown } from './config-calculate-breakdown.js';
import { calculateTotalScore } from './config-calculate-total-score.js';
import { checkCostPolicy } from './config-check-cost-policy.js';
import { STRATEGY_WEIGHTS, type ScoredCandidate } from './config-engine-shared.js';
import type {
  ConfigRouteRequest,
  ModelConfig,
  ResolvedRoutingConfig,
  RoutingCategoryConfig,
  RoutingRuntimeState,
} from './config.js';
export function scoreCandidates({
  resolvedConfig,
  models,
  request,
  category,
}: ScoreCandidatesArgs): ScoredCandidate[] {
  const strategy = category.defaultStrategy ?? resolvedConfig.defaultStrategy;
  const weights = STRATEGY_WEIGHTS[strategy] ?? STRATEGY_WEIGHTS['capability-match'];
  const strategyWeights = category.strategyWeights ?? resolvedConfig.strategyWeights;
  // Merge weights (category overrides global)
  const effectiveWeights = { ...weights };
  for (const [key, value] of Object.entries(strategyWeights)) {
    if (key in effectiveWeights && typeof value === 'number') {
      (effectiveWeights as Record<string, number>)[key] = value;
    }
  }
  const runtimeState = request.runtimeState;
  const now = Date.now();
  return models
    .map((model) => {
      return scoreRoutingCandidate({
        model: model,
        resolvedConfig: resolvedConfig,
        request: request,
        runtimeState: runtimeState,
        now: now,
        category: category,
        effectiveWeights: effectiveWeights,
      });
    })
    .sort((a, b) => b.score - a.score);
}
type ScoreCandidatesArgs = {
  resolvedConfig: ResolvedRoutingConfig;
  models: ModelConfig[];
  request: ConfigRouteRequest;
  category: RoutingCategoryConfig;
};
function scoreRoutingCandidate({
  model,
  resolvedConfig,
  request,
  runtimeState,
  now,
  category,
  effectiveWeights,
}: ScoreRoutingCandidateArgs) {
  const exclusionReasons: string[] = [];
  let excluded = false;
  // Check if model is disabled
  excluded = checkRoutingPolicy({
    model: model,
    excluded: excluded,
    exclusionReasons: exclusionReasons,
    resolvedConfig: resolvedConfig,
    request: request,
    runtimeState: runtimeState,
    now: now,
  });
  // Check preferred/excluded providers
  excluded = applyRoutingConstraints(request, model, excluded, exclusionReasons);
  // Calculate scores
  const breakdown = calculateBreakdown({
    resolvedConfig: resolvedConfig,
    model: model,
    request: request,
    category: category,
  });
  const score = calculateTotalScore({
    breakdown: breakdown,
    weights: effectiveWeights,
  });
  return {
    model,
    score,
    breakdown,
    excluded,
    exclusionReasons,
  };
}
function checkRoutingPolicy({
  model,
  excluded,
  exclusionReasons,
  resolvedConfig,
  request,
  runtimeState,
  now,
}: CheckRoutingPolicyArgs) {
  if (!model.enabled) {
    excluded = true;
    exclusionReasons.push('Model is disabled');
  }
  // Check cost policy
  const costCheck = checkCostPolicy({
    model: model,
    request: request,
    costPolicy: resolvedConfig.costPolicy,
  });
  if (!costCheck.allowed) {
    excluded = true;
    exclusionReasons.push(...costCheck.reasons);
  }
  // Check cooldown
  if (runtimeState && resolvedConfig.cooldownConfig.enabled) {
    const cooldownKey = `${model.provider}:${model.id}`;
    const cooldown = runtimeState.cooldowns[cooldownKey];
    if (cooldown && cooldown.expiresAt > now) {
      excluded = true;
      exclusionReasons.push(
        `Model in cooldown until ${new Date(cooldown.expiresAt).toISOString()}`,
      );
    }
  }
  return excluded;
}
function applyRoutingConstraints(
  request: ConfigRouteRequest,
  model: ModelConfig,
  excluded: boolean,
  exclusionReasons: string[],
) {
  if (request.preferredProviders && request.preferredProviders.length > 0) {
    if (!request.preferredProviders.includes(model.provider)) {
      excluded = true;
      exclusionReasons.push(`Provider ${model.provider} is excluded`);
    }
  }
  if (request.excludedProviders && request.excludedProviders.includes(model.provider)) {
    excluded = true;
    exclusionReasons.push(`Provider ${model.provider} is excluded`);
  }
  // Check max cost
  if (request.maxCost !== undefined && model.estimatedCostPer1kTokens !== undefined) {
    if (model.estimatedCostPer1kTokens > request.maxCost) {
      excluded = true;
      exclusionReasons.push(
        `Estimated cost ${model.estimatedCostPer1kTokens} exceeds max ${request.maxCost}`,
      );
    }
  }
  // Check max latency
  if (request.maxLatencyMs !== undefined && model.estimatedLatencyMs !== undefined) {
    if (model.estimatedLatencyMs > request.maxLatencyMs) {
      excluded = true;
      exclusionReasons.push(
        `Estimated latency ${model.estimatedLatencyMs}ms exceeds max ${request.maxLatencyMs}ms`,
      );
    }
  }
  // Check required capabilities
  if (request.requiredCapabilities && request.requiredCapabilities.length > 0) {
    const missing = request.requiredCapabilities.filter(
      (cap: string) => !model.capabilities.includes(cap),
    );
    if (missing.length > 0) {
      excluded = true;
      exclusionReasons.push(`Missing required capabilities: ${missing.join(', ')}`);
    }
  }
  return excluded;
}
type ScoreRoutingCandidateArgs = {
  model: ModelConfig;
  resolvedConfig: ResolvedRoutingConfig;
  request: ConfigRouteRequest;
  runtimeState: RoutingRuntimeState | undefined;
  now: number;
  category: RoutingCategoryConfig;
  effectiveWeights: {
    capabilityMatch: number;
    costScore: number;
    latencyScore: number;
    quotaScore: number;
    priorityScore: number;
  };
};
type CheckRoutingPolicyArgs = {
  model: ModelConfig;
  excluded: boolean;
  exclusionReasons: string[];
  resolvedConfig: ResolvedRoutingConfig;
  request: ConfigRouteRequest;
  runtimeState: RoutingRuntimeState | undefined;
  now: number;
};
