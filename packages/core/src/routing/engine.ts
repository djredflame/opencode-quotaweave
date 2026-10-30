/**
 * Routing Engine for QuotaWeave
 *
 * Selects optimal models based on task requirements, capabilities, cost, latency, and quota.
 */
import type {
  ModelCandidate,
  RouteRequest,
  RouteResult,
  RoutingEngineConfig,
  RoutingStrategy,
  RoutingStrategyType,
  ScoreBreakdown,
  ScoredCandidate,
} from './types.js';
/**
 * Default routing engine configuration
 */
const DEFAULT_CONFIG: Required<RoutingEngineConfig> = {
  defaultStrategy: 'capability-match',
  strategies: [
    { type: 'capability-match', weight: 1.0 },
    { type: 'cost-optimize', weight: 0.3 },
    { type: 'latency-optimize', weight: 0.3 },
    { type: 'quota-aware', weight: 0.4 },
  ],
  enableCapabilityMatching: true,
  maxDecisionTimeMs: 100,
  fallbackModel: '',
};
/**
 * Routing engine
 */
export class RoutingEngine {
  private config: Required<RoutingEngineConfig>;
  private strategies: Map<RoutingStrategyType, RoutingStrategy> = new Map();
  constructor(config: RoutingEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeStrategies();
  }
  /**
   * Initialize routing strategies
   */
  private initializeStrategies(): void {
    for (const strategy of this.config.strategies) {
      this.strategies.set(strategy.type, strategy);
    }
  }
  /**
   * Route a request to the best model
   */
  async route(request: RouteRequest): Promise<RouteResult> {
    const startTime = Date.now();
    // Filter available models
    const candidates = this.filterCandidates(request);
    if (candidates.length === 0) {
      return Promise.resolve(this.createNoMatchResult(request));
    }
    // Score candidates
    const scoredCandidates = this.scoreCandidates(candidates, request);
    // Select best candidate
    const bestCandidate = scoredCandidates[0];
    if (!bestCandidate) {
      return Promise.resolve(this.createNoMatchResult(request));
    }
    const decisionTime = Date.now() - startTime;
    if (decisionTime > this.config.maxDecisionTimeMs) {
      // Log warning but continue
    }
    return Promise.resolve(
      this.createResult(bestCandidate, scoredCandidates.slice(1), request, decisionTime),
    );
  }
  /**
   * Filter candidates based on request constraints
   */
  private filterCandidates(request: RouteRequest): ModelCandidate[] {
    return request.availableModels.filter((candidate) => {
      // Check excluded providers
      if (request.task.excludedProviders?.includes(candidate.provider)) {
        return false;
      }
      // Check preferred providers (if specified, only allow those)
      if (
        request.task.preferredProviders &&
        request.task.preferredProviders.length > 0 &&
        !request.task.preferredProviders.includes(candidate.provider)
      ) {
        return false;
      }
      // Check max cost
      if (request.task.maxCost !== undefined && candidate.estimatedCost !== undefined) {
        if (candidate.estimatedCost > request.task.maxCost) {
          return false;
        }
      }
      // Check max latency
      if (request.task.maxLatencyMs !== undefined && candidate.estimatedLatencyMs !== undefined) {
        if (candidate.estimatedLatencyMs > request.task.maxLatencyMs) {
          return false;
        }
      }
      // Check required capabilities
      if (request.task.requiredCapabilities && request.task.requiredCapabilities.length > 0) {
        const hasAllCapabilities = request.task.requiredCapabilities.every((cap) =>
          candidate.capabilities.includes(cap),
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }
      // Check quota availability
      if (candidate.quotaAvailable !== undefined && candidate.quotaAvailable <= 0) {
        return false;
      }
      return true;
    });
  }
  /**
   * Score candidates using configured strategies
   */
  private scoreCandidates(candidates: ModelCandidate[], request: RouteRequest): ScoredCandidate[] {
    const strategy = this.strategies.get(this.config.defaultStrategy);
    if (!strategy) {
      throw new Error(`Strategy ${this.config.defaultStrategy} not found`);
    }
    return candidates
      .map((candidate) => ({
        candidate,
        score: this.calculateScore(candidate, request, strategy),
        breakdown: this.calculateBreakdown(candidate, request),
      }))
      .sort((a, b) => b.score - a.score);
  }
  /**
   * Calculate composite score for a candidate
   */
  private calculateScore(
    candidate: ModelCandidate,
    request: RouteRequest,
    strategy: RoutingStrategy,
  ): number {
    const breakdown = this.calculateBreakdown(candidate, request);
    // Weighted scoring based on strategy
    const weights = this.getStrategyWeights(strategy.type);
    return (
      breakdown.capabilityMatch * weights.capabilityMatch +
      breakdown.costScore * weights.cost +
      breakdown.latencyScore * weights.latency +
      breakdown.quotaScore * weights.quota +
      breakdown.priorityScore * weights.priority
    );
  }
  /**
   * Get weights for a strategy
   */
  private getStrategyWeights(strategyType: RoutingStrategyType): {
    capabilityMatch: number;
    cost: number;
    latency: number;
    quota: number;
    priority: number;
  } {
    switch (strategyType) {
      case 'capability-match':
        return { capabilityMatch: 0.5, cost: 0.1, latency: 0.1, quota: 0.1, priority: 0.2 };
      case 'cost-optimize':
        return { capabilityMatch: 0.2, cost: 0.5, latency: 0.1, quota: 0.1, priority: 0.1 };
      case 'latency-optimize':
        return { capabilityMatch: 0.2, cost: 0.1, latency: 0.5, quota: 0.1, priority: 0.1 };
      case 'quota-aware':
        return { capabilityMatch: 0.2, cost: 0.1, latency: 0.1, quota: 0.5, priority: 0.1 };
      case 'priority-based':
        return { capabilityMatch: 0.1, cost: 0.1, latency: 0.1, quota: 0.1, priority: 0.6 };
      case 'round-robin':
        return { capabilityMatch: 0.2, cost: 0.2, latency: 0.2, quota: 0.2, priority: 0.2 };
      default:
        return { capabilityMatch: 0.3, cost: 0.2, latency: 0.2, quota: 0.15, priority: 0.15 };
    }
  }
  /**
   * Calculate score breakdown for explainability
   */
  private calculateBreakdown(candidate: ModelCandidate, request: RouteRequest): ScoreBreakdown {
    // Capability match score (0-1)
    let capabilityMatch = 1.0;
    if (request.task.requiredCapabilities && request.task.requiredCapabilities.length > 0) {
      const matched = request.task.requiredCapabilities.filter((cap) =>
        candidate.capabilities.includes(cap),
      ).length;
      capabilityMatch = matched / request.task.requiredCapabilities.length;
    }
    // Cost score (0-1, lower cost = higher score)
    let costScore = 0.5;
    if (candidate.estimatedCost !== undefined && request.task.maxCost !== undefined) {
      costScore = 1 - Math.min(candidate.estimatedCost / request.task.maxCost, 1);
    } else if (candidate.estimatedCost !== undefined) {
      // Normalize against some reasonable max
      costScore = 1 - Math.min(candidate.estimatedCost / 100, 1);
    }
    // Latency score (0-1, lower latency = higher score)
    let latencyScore = 0.5;
    if (candidate.estimatedLatencyMs !== undefined && request.task.maxLatencyMs !== undefined) {
      latencyScore = 1 - Math.min(candidate.estimatedLatencyMs / request.task.maxLatencyMs, 1);
    } else if (candidate.estimatedLatencyMs !== undefined) {
      latencyScore = 1 - Math.min(candidate.estimatedLatencyMs / 5000, 1);
    }
    // Quota score (0-1, more quota = higher score)
    let quotaScore = 0.5;
    if (candidate.quotaAvailable !== undefined) {
      quotaScore = Math.min(candidate.quotaAvailable / 100, 1);
    }
    // Priority score (0-1, higher priority = higher score)
    const priorityScore = Math.min(candidate.priority / 10, 1);
    return {
      capabilityMatch,
      costScore,
      latencyScore,
      quotaScore,
      priorityScore,
      customScores: {},
    };
  }
  /**
   * Create result from scored candidates
   */
  private createResult(
    best: ScoredCandidate,
    alternatives: ScoredCandidate[],
    request: RouteRequest,
    decisionTimeMs: number,
  ): RouteResult {
    const reason = this.generateReason(best);
    const confidence = Math.min(best.score, 1.0);
    return {
      selectedModel: best.candidate,
      alternatives: alternatives.map((a) => a.candidate),
      reason,
      confidence,
      metadata: {
        decisionTimeMs,
        strategy: this.config.defaultStrategy,
        candidatesEvaluated: alternatives.length + 1,
        scoreBreakdown: best.breakdown,
        requestId: request.context.requestId,
      },
    };
  }
  /**
   * Create result when no candidates match
   */
  private createNoMatchResult(request: RouteRequest): RouteResult {
    let fallbackModel: ModelCandidate | null = null;
    if (this.config.fallbackModel) {
      fallbackModel =
        request.availableModels.find((m) => m.id === this.config.fallbackModel) ?? null;
    }
    return {
      selectedModel: fallbackModel,
      alternatives: [],
      reason: fallbackModel
        ? `No matching models found, using fallback: ${fallbackModel.id}`
        : 'No matching models found and no fallback configured',
      confidence: fallbackModel ? 0.3 : 0.0,
      metadata: {
        decisionTimeMs: 0,
        strategy: this.config.defaultStrategy,
        candidatesEvaluated: 0,
        requestId: request.context.requestId,
        noMatch: true,
      },
    };
  }
  /**
   * Generate human-readable routing reason
   */
  private generateReason(best: ScoredCandidate): string {
    const { candidate, breakdown } = best;
    const reasons: string[] = [];
    if (breakdown.capabilityMatch > 0.8) {
      reasons.push('excellent capability match');
    } else if (breakdown.capabilityMatch > 0.5) {
      reasons.push('good capability match');
    }
    if (breakdown.costScore > 0.7) {
      reasons.push('cost-efficient');
    }
    if (breakdown.latencyScore > 0.7) {
      reasons.push('low latency');
    }
    if (breakdown.quotaScore > 0.7) {
      reasons.push('ample quota');
    }
    if (breakdown.priorityScore > 0.7) {
      reasons.push('high priority');
    }
    if (reasons.length === 0) {
      reasons.push('best available option');
    }
    return `Selected ${candidate.id} (${candidate.provider}): ${reasons.join(', ')}`;
  }
  /**
   * Add or update a routing strategy
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }
  /**
   * Get a routing strategy
   */
  getStrategy(type: RoutingStrategyType): RoutingStrategy | undefined {
    return this.strategies.get(type);
  }
  /**
   * List all strategies
   */
  listStrategies(): RoutingStrategy[] {
    return Array.from(this.strategies.values());
  }
  /**
   * Update configuration
   */
  updateConfig(config: Partial<RoutingEngineConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.strategies) {
      this.initializeStrategies();
    }
  }
}
/**
 * Create a default routing engine
 */
export function createDefaultRoutingEngine(): RoutingEngine {
  return new RoutingEngine();
}
