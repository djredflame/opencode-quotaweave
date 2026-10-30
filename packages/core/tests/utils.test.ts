import { requiredItem } from './required-item.js';
/**
 * Tests for utility functions
 */
import { describe, expect, it, vi } from 'vitest';
import {
  combineAbortSignals,
  createTimeoutSignal,
  deepClone,
  generateRequestId,
  generateSessionId,
  isEmpty,
  retry,
  sleep,
} from '../src/utils/helpers.js';
describe('Utility Functions', describeUtilityFunctions0);
function itShouldGenerateUniqueRequestIDs2() {
  const id1 = generateRequestId();
  const id2 = generateRequestId();
  expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
  expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
  expect(id1).not.toBe(id2);
}
function describeGenerateRequestId1() {
  it('should generate unique request IDs', itShouldGenerateUniqueRequestIDs2);
}
function itShouldGenerateUniqueSessionIDs4() {
  const id1 = generateSessionId();
  const id2 = generateSessionId();
  expect(id1).toMatch(/^sess_\d+_[a-z0-9]+$/);
  expect(id2).toMatch(/^sess_\d+_[a-z0-9]+$/);
  expect(id1).not.toBe(id2);
}
function describeGenerateSessionId3() {
  it('should generate unique session IDs', itShouldGenerateUniqueSessionIDs4);
}
function itShouldDeepCloneObjects6() {
  const original = { a: 1, b: { c: 2, d: [3, 4] } };
  const cloned = deepClone(original);
  expect(cloned).toEqual(original);
  expect(cloned).not.toBe(original);
  expect(cloned.b).not.toBe(original.b);
  expect(cloned.b.d).not.toBe(original.b.d);
}
function itShouldHandleArrays7() {
  const original = [1, 2, { a: 3 }];
  const cloned = deepClone(original);
  expect(cloned).toEqual(original);
  expect(cloned).not.toBe(original);
  expect(requiredItem(cloned, 2)).not.toBe(requiredItem(original, 2));
}
function itShouldHandlePrimitives8() {
  expect(deepClone(42)).toBe(42);
  expect(deepClone('string')).toBe('string');
  expect(deepClone(true)).toBe(true);
  expect(deepClone(null)).toBeNull();
}
function describeDeepClone5() {
  it('should deep clone objects', itShouldDeepCloneObjects6);
  it('should handle arrays', itShouldHandleArrays7);
  it('should handle primitives', itShouldHandlePrimitives8);
}
function itShouldReturnTrueForEmptyObject10() {
  expect(isEmpty({})).toBe(true);
}
function itShouldReturnFalseForNonEmptyObject11() {
  expect(isEmpty({ a: 1 })).toBe(false);
}
function itShouldReturnTrueForObjectWithOnly12() {
  const obj: Record<string, unknown> = {};
  Object.setPrototypeOf(obj, null);
  expect(isEmpty(obj)).toBe(true);
}
function describeIsEmpty9() {
  it('should return true for empty object', itShouldReturnTrueForEmptyObject10);
  it('should return false for non-empty object', itShouldReturnFalseForNonEmptyObject11);
  it(
    'should return true for object with only prototype properties',
    itShouldReturnTrueForObjectWithOnly12,
  );
}
async function itShouldResolveAfterSpecifiedTime14() {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThanOrEqual(40);
  expect(elapsed).toBeLessThan(200);
}
function describeSleep13() {
  it('should resolve after specified time', itShouldResolveAfterSpecifiedTime14);
}
async function itShouldSucceedOnFirstAttempt16() {
  const fn = vi.fn().mockResolvedValue('success');
  const result = await retry(fn, {
    maxAttempts: 3,
    baseDelayMs: 10,
    maxDelayMs: 100,
    backoffMultiplier: 2,
  });
  expect(result).toBe('success');
  expect(fn).toHaveBeenCalledTimes(1);
}
async function itShouldRetryOnFailure17() {
  const fn = vi
    .fn()
    .mockRejectedValueOnce(new Error('fail 1'))
    .mockRejectedValueOnce(new Error('fail 2'))
    .mockResolvedValue('success');
  const result = await retry(fn, {
    maxAttempts: 3,
    baseDelayMs: 10,
    maxDelayMs: 100,
    backoffMultiplier: 2,
  });
  expect(result).toBe('success');
  expect(fn).toHaveBeenCalledTimes(3);
}
async function itShouldThrowAfterMaxAttempts18() {
  const fn = vi.fn().mockRejectedValue(new Error('always fails'));
  await expect(
    retry(fn, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100, backoffMultiplier: 2 }),
  ).rejects.toThrow('always fails');
  expect(fn).toHaveBeenCalledTimes(3);
}
async function itShouldNotRetryNonRetryableErrors19() {
  const fn = vi.fn().mockRejectedValue(new Error('network timeout'));
  await expect(
    retry(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
      backoffMultiplier: 2,
      retryableErrors: ['retryable'],
    }),
  ).rejects.toThrow('network timeout');
  expect(fn).toHaveBeenCalledTimes(1);
}
async function itShouldRetryRetryableErrors20() {
  const fn = vi
    .fn()
    .mockRejectedValueOnce(new Error('retryable error'))
    .mockResolvedValue('success');
  const result = await retry(fn, {
    maxAttempts: 3,
    baseDelayMs: 10,
    maxDelayMs: 100,
    backoffMultiplier: 2,
    retryableErrors: ['retryable'],
  });
  expect(result).toBe('success');
  expect(fn).toHaveBeenCalledTimes(2);
}
function describeRetry15() {
  it('should succeed on first attempt', itShouldSucceedOnFirstAttempt16);
  it('should retry on failure', itShouldRetryOnFailure17);
  it('should throw after max attempts', itShouldThrowAfterMaxAttempts18);
  it('should not retry non-retryable errors', itShouldNotRetryNonRetryableErrors19);
  it('should retry retryable errors', itShouldRetryRetryableErrors20);
}
async function itShouldCreateSignalThatAbortsAfterTimeout22() {
  const signal = createTimeoutSignal(50);
  expect(signal.aborted).toBe(false);
  await sleep(100);
  expect(signal.aborted).toBe(true);
}
function describeCreateTimeoutSignal21() {
  it(
    'should create signal that aborts after timeout',
    itShouldCreateSignalThatAbortsAfterTimeout22,
  );
}
function itShouldCombineMultipleSignals24() {
  const controller1 = new AbortController();
  const controller2 = new AbortController();
  const combined = combineAbortSignals(controller1.signal, controller2.signal);
  expect(combined.aborted).toBe(false);
  controller1.abort();
  expect(combined.aborted).toBe(true);
}
function itShouldReturnAbortedSignalIfAnyInput25() {
  const controller1 = new AbortController();
  controller1.abort();
  const controller2 = new AbortController();
  const combined = combineAbortSignals(controller1.signal, controller2.signal);
  expect(combined.aborted).toBe(true);
}
function describeCombineAbortSignals23() {
  it('should combine multiple signals', itShouldCombineMultipleSignals24);
  it(
    'should return aborted signal if any input is already aborted',
    itShouldReturnAbortedSignalIfAnyInput25,
  );
}
function describeUtilityFunctions0() {
  describe('generateRequestId', describeGenerateRequestId1);
  describe('generateSessionId', describeGenerateSessionId3);
  describe('deepClone', describeDeepClone5);
  describe('isEmpty', describeIsEmpty9);
  describe('sleep', describeSleep13);
  describe('retry', describeRetry15);
  describe('createTimeoutSignal', describeCreateTimeoutSignal21);
  describe('combineAbortSignals', describeCombineAbortSignals23);
}
