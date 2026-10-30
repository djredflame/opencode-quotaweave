import type { CoreContext } from '../src/types.js';
/**
 * Tests for QuotaManager
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QuotaManager } from '../src/quota/manager.js';
import type { QuotaAllocationRequest, QuotaConfig } from '../src/quota/types.js';
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
function itShouldRegisterAValidQuotaConfig4() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  expect(manager.getQuotaConfig('test-quota')).toEqual(config);
}
function itShouldThrowForInvalidConfig5() {
  const config = {
    id: '',
    name: 'Test',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  } as QuotaConfig;
  expect(() => manager.registerQuota(config)).toThrow('Quota config must have a valid id');
}
function itShouldThrowForInvalidLimit6() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 0,
    periodHours: 24,
    enabled: true,
  };
  expect(() => manager.registerQuota(config)).toThrow('Quota config must have a positive limit');
}
function describeRegisterQuota3() {
  it('should register a valid quota config', itShouldRegisterAValidQuotaConfig4);
  it('should throw for invalid config', itShouldThrowForInvalidConfig5);
  it('should throw for invalid limit', itShouldThrowForInvalidLimit6);
}
async function itShouldAllocateQuotaSuccessfully8() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const request: QuotaAllocationRequest = {
    configId: 'test-quota',
    units: 10,
    context: createTestContext(),
  };
  const result = await manager.allocate(request);
  expect(result.success).toBe(true);
  expect(result.allocated).toBe(10);
  expect(result.remaining).toBe(90);
  expect(result.state.used).toBe(10);
  expect(result.state.remaining).toBe(90);
}
async function itShouldFailWhenQuotaExhausted9() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 10,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  // Use all quota
  await manager.allocate({ configId: 'test-quota', units: 10, context: createTestContext() });
  // Try to allocate more
  const result = await manager.allocate({
    configId: 'test-quota',
    units: 1,
    context: createTestContext(),
  });
  expect(result.success).toBe(false);
  expect(result.error).toContain('Insufficient quota');
}
async function itShouldFailForNonExistentQuota10() {
  const result = await manager.allocate({
    configId: 'non-existent',
    units: 10,
    context: createTestContext(),
  });
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quota configuration not found');
}
async function itShouldFailWhenQuotaDisabled11() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: false,
  };
  manager.registerQuota(config);
  const result = await manager.allocate({
    configId: 'test-quota',
    units: 10,
    context: createTestContext(),
  });
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quota is disabled');
}
async function itShouldCreateReservationWhenRequested12() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const result = await manager.allocate({
    configId: 'test-quota',
    units: 10,
    context: createTestContext(),
    reserve: true,
  });
  expect(result.success).toBe(true);
  expect(result.allocationId).toBeDefined();
  expect(result.remaining).toBe(90);
}
function describeAllocate7() {
  it('should allocate quota successfully', itShouldAllocateQuotaSuccessfully8);
  it('should fail when quota exhausted', itShouldFailWhenQuotaExhausted9);
  it('should fail for non-existent quota', itShouldFailForNonExistentQuota10);
  it('should fail when quota disabled', itShouldFailWhenQuotaDisabled11);
  it('should create reservation when requested', itShouldCreateReservationWhenRequested12);
}
async function itShouldReleaseReservationAndReturnQuota14() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const allocResult = await manager.allocate({
    configId: 'test-quota',
    units: 10,
    context: createTestContext(),
    reserve: true,
  });
  expect(allocResult.allocationId).toBeDefined();
  const released = await manager.releaseReservation('test-quota', allocResult.allocationId!);
  expect(released).toBe(true);
  const state = manager.getQuotaState('test-quota');
  expect(state?.remaining).toBe(100);
  expect(state?.used).toBe(0);
}
async function itShouldReturnFalseForInvalidAllocationID15() {
  const config: QuotaConfig = {
    id: 'test-quota',
    name: 'Test Quota',
    type: 'requests',
    limit: 100,
    periodHours: 24,
    enabled: true,
  };
  manager.registerQuota(config);
  const released = await manager.releaseReservation('test-quota', 'invalid-id');
  expect(released).toBe(false);
}
function describeReleaseReservation13() {
  it('should release reservation and return quota', itShouldReleaseReservationAndReturnQuota14);
  it('should return false for invalid allocation ID', itShouldReturnFalseForInvalidAllocationID15);
}
function describeQuotaManager0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('registerQuota', describeRegisterQuota3);
  describe('allocate', describeAllocate7);
  describe('releaseReservation', describeReleaseReservation13);
}
