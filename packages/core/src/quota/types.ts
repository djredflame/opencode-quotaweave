/**
 * Quota manager types for QuotaWeave
 */

import type { CoreContext } from '../types.js';

/**
 * Quota configuration for a model or globally
 */
export interface QuotaConfig {
  /** Quota identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Quota type */
  type: QuotaType;
  /** Quota limit (units per period) */
  limit: number;
  /** Quota period in hours */
  periodHours: number;
  /** Warning threshold percentage (0-100) */
  warningThreshold?: number;
  /** Critical threshold percentage (0-100) */
  criticalThreshold?: number;
  /** Whether quota is enabled */
  enabled: boolean;
  /** Associated model/provider (if model-specific) */
  scope?: QuotaScope;
  /** Quota metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Quota type
 */
export type QuotaType = 'requests' | 'tokens' | 'cost' | 'time';

/**
 * Quota scope
 */
export interface QuotaScope {
  /** Model IDs this quota applies to */
  modelIds?: string[];
  /** Provider IDs this quota applies to */
  providerIds?: string[];
  /** User/session IDs this quota applies to */
  sessionIds?: string[];
  /** Global quota (applies to all) */
  global?: boolean;
}

/**
 * Current quota state
 */
export interface QuotaState {
  /** Quota configuration ID */
  configId: string;
  /** Current usage */
  used: number;
  /** Quota limit */
  limit: number;
  /** Remaining quota */
  remaining: number;
  /** Usage percentage (0-100) */
  usagePercent: number;
  /** Period start timestamp */
  periodStart: number;
  /** Period end timestamp */
  periodEnd: number;
  /** Whether quota is in warning state */
  isWarning: boolean;
  /** Whether quota is in critical state */
  isCritical: boolean;
  /** Whether quota is exhausted */
  isExhausted: boolean;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Quota allocation request
 */
export interface QuotaAllocationRequest {
  /** Quota config ID */
  configId: string;
  /** Units to allocate */
  units: number;
  /** Core context */
  context: CoreContext;
  /** Whether to reserve (block) or consume immediately */
  reserve?: boolean;
  /** Reservation TTL in ms (if reserving) */
  reservationTtlMs?: number;
}

/**
 * Quota allocation result
 */
export interface QuotaAllocation {
  /** Whether allocation succeeded */
  success: boolean;
  /** Allocated units */
  allocated: number;
  /** Remaining quota after allocation */
  remaining: number;
  /** Allocation ID (for reservations) */
  allocationId: string | undefined;
  /** Error message if failed */
  error: string | undefined;
  /** Quota state after allocation */
  state: QuotaState;
}

/**
 * Quota manager configuration
 */
export interface QuotaManagerConfig {
  /** Default quota period in hours */
  defaultPeriodHours: number;
  /** Enable automatic quota replenishment */
  autoReplenish: boolean;
  /** Replenishment check interval in ms */
  replenishIntervalMs: number;
  /** Warning threshold percentage (0-100) */
  warningThreshold: number;
  /** Critical threshold percentage (0-100) */
  criticalThreshold: number;
  /** Enable quota reservations */
  enableReservations: boolean;
  /** Default reservation TTL in ms */
  defaultReservationTtlMs: number;
  /** Maximum reservations per quota */
  maxReservationsPerQuota: number;
}

/**
 * Quota usage record
 */
export interface QuotaUsageRecord {
  /** Quota config ID */
  configId: string;
  /** Units used */
  units: number;
  /** Timestamp */
  timestamp: number;
  /** Request context */
  context: CoreContext;
  /** Allocation ID if reserved */
  allocationId: string | undefined;
}

/**
 * Quota event for monitoring
 */
export interface QuotaEvent {
  /** Event type */
  type: QuotaEventType;
  /** Quota config ID */
  configId: string;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Quota event types
 */
export type QuotaEventType =
  | 'allocated'
  | 'released'
  | 'reserved'
  | 'reservation_expired'
  | 'warning_threshold_reached'
  | 'critical_threshold_reached'
  | 'exhausted'
  | 'replenished'
  | 'config_changed';
