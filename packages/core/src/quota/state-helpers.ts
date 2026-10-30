import type { QuotaConfig, QuotaState, QuotaUsageRecord } from './types.js';

export function validateConfig(config: QuotaConfig): void {
  if (!config.id || typeof config.id !== 'string') {
    throw new Error('Quota config must have a valid id');
  }
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Quota config must have a valid name');
  }
  if (!['requests', 'tokens', 'cost', 'time'].includes(config.type)) {
    throw new Error('Quota config must have a valid type');
  }
  if (typeof config.limit !== 'number' || config.limit <= 0) {
    throw new Error('Quota config must have a positive limit');
  }
  if (typeof config.periodHours !== 'number' || config.periodHours <= 0) {
    throw new Error('Quota config must have a positive periodHours');
  }
  if (typeof config.enabled !== 'boolean') {
    throw new Error('Quota config must have a boolean enabled field');
  }
}

export function createEmptyState(configId: string): QuotaState {
  return {
    configId,
    used: 0,
    limit: 0,
    remaining: 0,
    usagePercent: 0,
    periodStart: Date.now(),
    periodEnd: Date.now(),
    isWarning: false,
    isCritical: false,
    isExhausted: true,
    lastUpdated: Date.now(),
  };
}

export function sanitizeState(state: InternalQuotaState): QuotaState {
  return {
    configId: state.configId,
    used: state.used,
    limit: state.limit,
    remaining: state.remaining,
    usagePercent: state.usagePercent,
    periodStart: state.periodStart,
    periodEnd: state.periodEnd,
    isWarning: state.isWarning,
    isCritical: state.isCritical,
    isExhausted: state.isExhausted,
    lastUpdated: state.lastUpdated,
  };
}

export interface InternalQuotaState extends QuotaState {
  reservations: Map<string, { units: number; expiresAt: number }>;
  usageHistory: QuotaUsageRecord[];
}
