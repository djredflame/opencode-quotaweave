import type { QuotaEvent } from '../src/quota/types.js';
import type { CoreContext } from '../src/types.js';
import { requiredItem } from './required-item.js';
/**
 * Tests for QuotaManager
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QuotaManager } from '../src/quota/manager.js';
import type { QuotaConfig } from '../src/quota/types.js';
let manager: QuotaManager;
function createTestContext(overrides: Partial<CoreContext> = {}): CoreContext {
  return {
    requestId: 'test-request',
    timestamp: Date.now(),
    sessionId: 'test-session',
    ...overrides,
  };
}
describe('QuotaManager', describeQuotaManager0);
function beforeEachBeforeEach1() {
  manager = new QuotaManager({ autoReplenish: false });
}
function afterEachAfterEach2() {
  manager.shutdown();
}
function itShouldReturnCurrentQuotaState4() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const state = manager.getQuotaState('test-quota');
  expect(state).toBeDefined();
  expect(state?.configId).toBe('test-quota');
  expect(state?.limit).toBe(100);
  expect(state?.remaining).toBe(100);
  expect(state?.usagePercent).toBe(0);
}
function itShouldReturnUndefinedForNonExistentQuota5() {
  const state = manager.getQuotaState('non-existent');
  expect(state).toBeUndefined();
}
function describeGetQuotaState3() {
  it('should return current quota state', itShouldReturnCurrentQuotaState4);
  it('should return undefined for non-existent quota', itShouldReturnUndefinedForNonExistentQuota5);
}
async function itShouldReturnMostRestrictiveStateForModel7() {
  const config1: QuotaConfig = {
    id: 'quota-1',
    name: 'Quota 1',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
    scope: { modelIds: ['model-1'] },
  };
  const config2: QuotaConfig = {
    id: 'quota-2',
    name: 'Quota 2',
    type: 'requests',
    limit: 50,
    periodHours: 24,
    enabled: true,
    scope: { modelIds: ['model-1'] },
  };
  manager.registerQuota(config1);
  manager.registerQuota(config2);
  // Use some quota on both
  await manager.allocate({ configId: 'quota-1', units: 50, context: createTestContext() });
  await manager.allocate({ configId: 'quota-2', units: 40, context: createTestContext() });
  const aggregate = manager.getAggregateQuotaState('model-1');
  expect(aggregate).not.toBeNull();
  // Should return the more restrictive one (quota-2 at 80% usage)
  expect(aggregate?.usagePercent).toBeGreaterThanOrEqual(80);
}
function itShouldReturnNullForModelWithNo8() {
  const aggregate = manager.getAggregateQuotaState('unknown-model');
  expect(aggregate).toBeNull();
}
function describeGetAggregateQuotaState6() {
  it('should return most restrictive state for model', itShouldReturnMostRestrictiveStateForModel7);
  it('should return null for model with no quotas', itShouldReturnNullForModelWithNo8);
}
async function itShouldEmitAllocatedEvent10() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const events: QuotaEvent[] = [];
  const unsubscribe = manager.on('allocated', (e) => events.push(e));
  await manager.allocate({ configId: 'test-quota', units: 10, context: createTestContext() });
  expect(events).toHaveLength(1);
  expect(requiredItem(events, 0).type).toBe('allocated');
  expect(requiredItem(events, 0).configId).toBe('test-quota');
  unsubscribe();
}
async function itShouldEmitWarningThresholdReachedEvent11() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
    warningThreshold: 50,
  };
  manager.registerQuota(config);
  const events: QuotaEvent[] = [];
  const unsubscribe = manager.on('warning_threshold_reached', (e) => events.push(e));
  await manager.allocate({ configId: 'test-quota', units: 60, context: createTestContext() });
  expect(events).toHaveLength(1);
  expect(requiredItem(events, 0).type).toBe('warning_threshold_reached');
  unsubscribe();
}
function describeEvents9() {
  it('should emit allocated event', itShouldEmitAllocatedEvent10);
  it('should emit warning_threshold_reached event', itShouldEmitWarningThresholdReachedEvent11);
}
function describeQuotaManager0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('getQuotaState', describeGetQuotaState3);
  describe('getAggregateQuotaState', describeGetAggregateQuotaState6);
  describe('events', describeEvents9);
}
