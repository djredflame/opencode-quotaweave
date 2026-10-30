import { EventBus } from '../utils/events.js';
import { initializeState } from './initial-state.js';
import type { InternalQuotaState } from './state-helpers.js';
import { createEmptyState, sanitizeState, validateConfig } from './state-helpers.js';
/**
 * Quota Manager for QuotaWeave
 *
 * Manages quota allocation, tracking, and replenishment for models and providers.
 */

import type {
  QuotaAllocation,
  QuotaAllocationRequest,
  QuotaConfig,
  QuotaEvent,
  QuotaEventType,
  QuotaManagerConfig,
  QuotaState,
  QuotaUsageRecord,
} from './types.js';

/**
 * Default quota manager configuration
 */
const DEFAULT_CONFIG: Required<QuotaManagerConfig> = {
  defaultPeriodHours: 24,
  autoReplenish: true,
  replenishIntervalMs: 60 * 60 * 1000, // 1 hour
  warningThreshold: 80,
  criticalThreshold: 95,
  enableReservations: true,
  defaultReservationTtlMs: 5 * 60 * 1000, // 5 minutes
  maxReservationsPerQuota: 100,
};

/**
 * Internal quota state with reservations
 */

/**
 * Quota manager
 */
export class QuotaManager {
  private configs: Map<string, QuotaConfig> = new Map();
  private states: Map<string, InternalQuotaState> = new Map();
  private config: Required<QuotaManagerConfig>;
  private replenishTimer: ReturnType<typeof setInterval> | null = null;
  private events = new EventBus<QuotaEvent>();

  constructor(config: Partial<QuotaManagerConfig> = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startReplenishment();
  }

  /**
   * Register a quota configuration
   */
  registerQuota(config: QuotaConfig): void {
    validateConfig(config);
    this.configs.set(config.id, config);
    this.states.set(config.id, initializeState(config));
  }

  /**
   * Unregister a quota configuration
   */
  unregisterQuota(configId: string): boolean {
    this.configs.delete(configId);
    return this.states.delete(configId);
  }

  /**
   * Get quota configuration
   */
  getQuotaConfig(configId: string): QuotaConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * List all quota configurations
   */
  listQuotaConfigs(): QuotaConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get current quota state
   */
  getQuotaState(configId: string): QuotaState | undefined {
    const state = this.states.get(configId);
    return state ? sanitizeState(state) : undefined;
  }

  /**
   * Get all quota states
   */
  getAllQuotaStates(): QuotaState[] {
    return Array.from(this.states.values()).map((s) => sanitizeState(s));
  }

  /**
   * Allocate quota units
   */
  async allocate(request: QuotaAllocationRequest): Promise<QuotaAllocation> {
    const state = this.states.get(request.configId);
    const config = this.configs.get(request.configId);

    if (!state || !config) {
      return Promise.resolve(this.createFailedAllocation(request, 'Quota configuration not found'));
    }

    if (!config.enabled) {
      return Promise.resolve(this.createFailedAllocation(request, 'Quota is disabled'));
    }

    // Check if period needs replenishment
    this.checkAndReplenish(request.configId);

    // Check availability
    const available = state.remaining;
    if (request.units > available) {
      return Promise.resolve(
        this.createFailedAllocation(
          request,
          `Insufficient quota: requested ${request.units}, available ${available}`,
        ),
      );
    }

    // Check reservations limit
    if (request.reserve && state.reservations.size >= this.config.maxReservationsPerQuota) {
      return Promise.resolve(this.createFailedAllocation(request, 'Maximum reservations reached'));
    }

    // Allocate
    state.used += request.units;
    state.remaining = Math.max(0, state.limit - state.used);
    state.usagePercent = (state.used / state.limit) * 100;
    state.lastUpdated = Date.now();

    // Handle reservation
    let allocationId: string | undefined;
    if (request.reserve) {
      allocationId = this.createReservation(
        state,
        request.units,
        request.reservationTtlMs ?? this.config.defaultReservationTtlMs,
      );
    }

    // Record usage
    this.recordAllocation(request, allocationId, state, config);

    return Promise.resolve({
      success: true,
      allocated: request.units,
      remaining: state.remaining,
      allocationId,
      error: undefined,
      state: sanitizeState(state),
    });
  }

  private recordAllocation(
    request: QuotaAllocationRequest,
    allocationId: string | undefined,
    state: InternalQuotaState,
    config: QuotaConfig,
  ) {
    const usageRecord: QuotaUsageRecord = {
      configId: request.configId,
      units: request.units,
      timestamp: Date.now(),
      context: request.context,
      allocationId,
    };
    state.usageHistory.push(usageRecord);

    // Check thresholds
    this.checkThresholds(config, state);

    // Emit event
    this.emitEvent({
      type: request.reserve ? 'reserved' : 'allocated',
      configId: request.configId,
      timestamp: Date.now(),
      data: { units: request.units, allocationId, context: request.context },
    });
  }

  /**
   * Release a reservation
   */
  async releaseReservation(configId: string, allocationId: string): Promise<boolean> {
    const state = this.states.get(configId);
    if (!state) {
      return Promise.resolve(false);
    }

    const reservation = state.reservations.get(allocationId);
    if (!reservation) {
      return Promise.resolve(false);
    }

    // Return units to available quota
    state.used = Math.max(0, state.used - reservation.units);
    state.remaining = Math.min(state.limit, state.limit - state.used);
    state.usagePercent = (state.used / state.limit) * 100;
    state.lastUpdated = Date.now();

    state.reservations.delete(allocationId);

    this.emitEvent({
      type: 'released',
      configId,
      timestamp: Date.now(),
      data: { units: reservation.units, allocationId },
    });

    return Promise.resolve(true);
  }

  /**
   * Get quota configurations for a model
   */
  getQuotasForModel(modelId: string): QuotaConfig[] {
    return Array.from(this.configs.values()).filter((config) => {
      if (config.scope?.global) return true;
      if (config.scope?.modelIds?.includes(modelId)) return true;
      return false;
    });
  }

  /**
   * Get aggregate quota state for a model
   */
  getAggregateQuotaState(modelId: string): QuotaState | null {
    const quotas = this.getQuotasForModel(modelId);
    if (quotas.length === 0) return null;

    const states = quotas
      .map((q) => this.getQuotaState(q.id))
      .filter((s): s is QuotaState => s !== undefined);
    if (states.length === 0) return null;

    // Return most restrictive state
    return states.reduce((mostRestrictive, current) => {
      if (current.usagePercent > mostRestrictive.usagePercent) {
        return current;
      }
      return mostRestrictive;
    });
  }

  /**
   * Subscribe to quota events
   */
  on(eventType: QuotaEventType, listener: (event: QuotaEvent) => void): () => void {
    return this.events.on(eventType, listener);
  }

  /**
   * Emit quota event
   */
  private emitEvent(event: QuotaEvent): void {
    this.events.emit(event);
  }

  /**
   * Check and replenish quota if period has passed
   */
  private checkAndReplenish(configId: string): void {
    const state = this.states.get(configId);
    const config = this.configs.get(configId);
    if (!state || !config || !this.config.autoReplenish) return;

    const now = Date.now();
    if (now >= state.periodEnd) {
      // Replenish
      state.used = 0;
      state.remaining = config.limit;
      state.usagePercent = 0;
      state.periodStart = now - (now % (config.periodHours * 60 * 60 * 1000));
      state.periodEnd = state.periodStart + config.periodHours * 60 * 60 * 1000;
      state.isWarning = false;
      state.isCritical = false;
      state.isExhausted = false;
      state.lastUpdated = now;
      state.reservations.clear();
      state.usageHistory = [];

      this.emitEvent({
        type: 'replenished',
        configId,
        timestamp: now,
        data: { newPeriodStart: state.periodStart, newPeriodEnd: state.periodEnd },
      });
    }
  }

  /**
   * Check warning/critical thresholds
   */
  private checkThresholds(config: QuotaConfig, state: InternalQuotaState): void {
    const warningThreshold = config.warningThreshold ?? this.config.warningThreshold;
    const criticalThreshold = config.criticalThreshold ?? this.config.criticalThreshold;

    const wasWarning = state.isWarning;
    const wasCritical = state.isCritical;
    const wasExhausted = state.isExhausted;

    state.isWarning = state.usagePercent >= warningThreshold;
    state.isCritical = state.usagePercent >= criticalThreshold;
    state.isExhausted = state.remaining <= 0;

    if (!wasWarning && state.isWarning) {
      this.emitEvent({
        type: 'warning_threshold_reached',
        configId: config.id,
        timestamp: Date.now(),
        data: { usagePercent: state.usagePercent, threshold: warningThreshold },
      });
    }

    if (!wasCritical && state.isCritical) {
      this.emitEvent({
        type: 'critical_threshold_reached',
        configId: config.id,
        timestamp: Date.now(),
        data: { usagePercent: state.usagePercent, threshold: criticalThreshold },
      });
    }

    if (!wasExhausted && state.isExhausted) {
      this.emitEvent({
        type: 'exhausted',
        configId: config.id,
        timestamp: Date.now(),
        data: { usagePercent: state.usagePercent },
      });
    }
  }

  /**
   * Create a reservation
   */
  private createReservation(state: InternalQuotaState, units: number, ttlMs: number): string {
    const allocationId = `alloc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = Date.now() + ttlMs;
    state.reservations.set(allocationId, { units, expiresAt });
    return allocationId;
  }

  /**
   * Start periodic replenishment check
   */
  private startReplenishment(): void {
    if (!this.config.autoReplenish) return;

    this.replenishTimer = setInterval(() => {
      for (const configId of this.configs.keys()) {
        this.checkAndReplenish(configId);
      }
      // Clean expired reservations
      this.cleanExpiredReservations();
    }, this.config.replenishIntervalMs);

    // Don't prevent process exit
    this.replenishTimer.unref?.();
  }

  /**
   * Clean expired reservations
   */
  private cleanExpiredReservations(): void {
    const now = Date.now();
    for (const state of this.states.values()) {
      for (const [allocationId, reservation] of state.reservations.entries()) {
        if (reservation.expiresAt <= now) {
          // Return units
          state.used = Math.max(0, state.used - reservation.units);
          state.remaining = Math.min(state.limit, state.limit - state.used);
          state.usagePercent = (state.used / state.limit) * 100;
          state.reservations.delete(allocationId);

          this.emitEvent({
            type: 'reservation_expired',
            configId: state.configId,
            timestamp: now,
            data: { units: reservation.units, allocationId },
          });
        }
      }
    }
  }

  /**
   * Create failed allocation result
   */
  private createFailedAllocation(request: QuotaAllocationRequest, error: string): QuotaAllocation {
    const state = this.states.get(request.configId);
    return {
      success: false,
      allocated: 0,
      remaining: state?.remaining ?? 0,
      allocationId: undefined,
      error,
      state: state ? sanitizeState(state) : createEmptyState(request.configId),
    };
  }

  /**
   * Shutdown the quota manager
   */
  shutdown(): void {
    if (this.replenishTimer) {
      clearInterval(this.replenishTimer);
      this.replenishTimer = null;
    }
    this.events.clear();
  }
}

/**
 * Create a default quota manager
 */
export function createDefaultQuotaManager(): QuotaManager {
  return new QuotaManager();
}
