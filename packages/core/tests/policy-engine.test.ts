import { requiredItem } from './required-item.js';
/**
 * Tests for PolicyEngine
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { PolicyEngine } from '../src/policy/engine.js';
import type { Policy, PolicyEvaluationContext } from '../src/policy/types.js';
let engine: PolicyEngine;
function createTestContext(
  overrides: Partial<PolicyEvaluationContext> = {},
): PolicyEvaluationContext {
  return {
    task: {
      type: 'general',
      priority: 5,
      ...overrides.task,
    },
    models: [],
    quota: { models: {}, global: { used: 0, total: 100, periodEnd: Date.now() + 3600000 } },
    session: {
      sessionId: 'test-session',
      tags: [],
      ...overrides.session,
    },
    ...overrides,
  };
}
describe('PolicyEngine', describePolicyEngine0);
function beforeEachBeforeEach1() {
  engine = new PolicyEngine();
}
function itShouldRegisterAValidPolicy3() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'rule-1',
        name: 'Allow All',
        priority: 10,
        conditions: [],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  expect(engine.getPolicy('test-policy')).toEqual(policy);
}
function itShouldThrowForInvalidPolicy4() {
  const invalidPolicy = {
    id: '',
    version: '1.0.0',
    name: 'Test',
    rules: [],
  } as Policy;
  expect(() => engine.registerPolicy(invalidPolicy)).toThrow('Policy must have a valid id');
}
function itShouldThrowForPolicyWithInvalidRule5() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'rule-1',
        name: 'Invalid Rule',
        priority: 'high' as unknown as number,
        conditions: [],
        actions: [],
        enabled: true,
      },
    ],
  };
  expect(() => engine.registerPolicy(policy)).toThrow('Rule must have a numeric priority');
}
function describeRegisterPolicy2() {
  it('should register a valid policy', itShouldRegisterAValidPolicy3);
  it('should throw for invalid policy', itShouldThrowForInvalidPolicy4);
  it('should throw for policy with invalid rule', itShouldThrowForPolicyWithInvalidRule5);
}
function itShouldUnregisterExistingPolicy7() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [],
  };
  engine.registerPolicy(policy);
  expect(engine.unregisterPolicy('test-policy')).toBe(true);
  expect(engine.getPolicy('test-policy')).toBeUndefined();
}
function itShouldReturnFalseForNonExistentPolicy8() {
  expect(engine.unregisterPolicy('non-existent')).toBe(false);
}
function describeUnregisterPolicy6() {
  it('should unregister existing policy', itShouldUnregisterExistingPolicy7);
  it('should return false for non-existent policy', itShouldReturnFalseForNonExistentPolicy8);
}
function itShouldAllowByDefaultWhenNoPolicy10() {
  const context = createTestContext();
  const decision = engine.evaluate(context);
  expect(decision.allowed).toBe(true);
  expect(decision.appliedRules).toHaveLength(0);
}
function itShouldEvaluateRegisteredPolicy11() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'rule-1',
        name: 'Allow All',
        priority: 10,
        conditions: [],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const context = createTestContext();
  const decision = engine.evaluate(context, 'test-policy');
  expect(decision.allowed).toBe(true);
  expect(decision.appliedRules).toHaveLength(1);
  expect(requiredItem(decision.appliedRules, 0).id).toBe('rule-1');
}
function itShouldDenyWhenDenyActionMatched12() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'deny-rule',
        name: 'Deny Expensive Models',
        priority: 10,
        conditions: [{ field: 'task.maxCost', operator: 'lessThan', value: 10 }],
        actions: [{ type: 'deny', params: { reason: 'Cost too high' } }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const context = createTestContext({ task: { maxCost: 5 } });
  const decision = engine.evaluate(context, 'test-policy');
  expect(decision.allowed).toBe(false);
  expect(decision.denialReason).toBe('Cost too high');
}
function itShouldApplyMultipleRulesInPriorityOrder13() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'low-priority',
        name: 'Low Priority Rule',
        priority: 1,
        conditions: [],
        actions: [{ type: 'addTag', params: { tag: 'low' } }],
        enabled: true,
      },
      {
        id: 'high-priority',
        name: 'High Priority Rule',
        priority: 100,
        conditions: [],
        actions: [{ type: 'addTag', params: { tag: 'high' } }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const context = createTestContext();
  const decision = engine.evaluate(context, 'test-policy');
  expect(decision.appliedRules).toHaveLength(2);
  expect(requiredItem(decision.appliedRules, 0).id).toBe('high-priority');
  expect(requiredItem(decision.appliedRules, 1).id).toBe('low-priority');
}
function itShouldSkipDisabledRules14() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'enabled-rule',
        name: 'Enabled Rule',
        priority: 10,
        conditions: [],
        actions: [{ type: 'addTag', params: { tag: 'enabled' } }],
        enabled: true,
      },
      {
        id: 'disabled-rule',
        name: 'Disabled Rule',
        priority: 20,
        conditions: [],
        actions: [{ type: 'addTag', params: { tag: 'disabled' } }],
        enabled: false,
      },
    ],
  };
  engine.registerPolicy(policy);
  const context = createTestContext();
  const decision = engine.evaluate(context, 'test-policy');
  expect(decision.appliedRules).toHaveLength(1);
  expect(requiredItem(decision.appliedRules, 0).id).toBe('enabled-rule');
}
function describeEvaluate9() {
  it('should allow by default when no policy matched', itShouldAllowByDefaultWhenNoPolicy10);
  it('should evaluate registered policy', itShouldEvaluateRegisteredPolicy11);
  it('should deny when deny action matched', itShouldDenyWhenDenyActionMatched12);
  it('should apply multiple rules in priority order', itShouldApplyMultipleRulesInPriorityOrder13);
  it('should skip disabled rules', itShouldSkipDisabledRules14);
}
function describePolicyEngine0() {
  beforeEach(beforeEachBeforeEach1);
  describe('registerPolicy', describeRegisterPolicy2);
  describe('unregisterPolicy', describeUnregisterPolicy6);
  describe('evaluate', describeEvaluate9);
}
