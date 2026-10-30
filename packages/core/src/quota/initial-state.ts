import type { InternalQuotaState } from './state-helpers.js';
import type { QuotaConfig } from './types.js';

export function initializeState(config: QuotaConfig): InternalQuotaState {
  const now = Date.now();
  const periodMs = config.periodHours * 60 * 60 * 1000;
  const periodStart = now - (now % periodMs);
  const periodEnd = periodStart + periodMs;

  const state: InternalQuotaState = {
    configId: config.id,
    used: 0,
    limit: config.limit,
    remaining: config.limit,
    usagePercent: 0,
    periodStart,
    periodEnd,
    isWarning: false,
    isCritical: false,
    isExhausted: false,
    lastUpdated: now,
    reservations: new Map(),
    usageHistory: [],
  };

  return state;
}
