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
function itShouldEvaluateEqualsOperator3() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'equals-rule',
        name: 'Equals Rule',
        priority: 10,
        conditions: [{ field: 'task.type', operator: 'equals', value: 'coding' }],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const contextMatch = createTestContext({ task: { type: 'coding' } });
  const decisionMatch = engine.evaluate(contextMatch, 'test-policy');
  expect(decisionMatch.allowed).toBe(true);
  expect(decisionMatch.appliedRules).toHaveLength(1);
  const contextNoMatch = createTestContext({ task: { type: 'writing' } });
  const decisionNoMatch = engine.evaluate(contextNoMatch, 'test-policy');
  expect(decisionNoMatch.appliedRules).toHaveLength(0);
}
function itShouldEvaluateContainsOperator4() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'contains-rule',
        name: 'Contains Rule',
        priority: 10,
        conditions: [{ field: 'task.requiredCapabilities', operator: 'contains', value: 'coding' }],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const contextMatch = createTestContext({
    task: { requiredCapabilities: ['coding', 'reasoning'] },
  });
  const decisionMatch = engine.evaluate(contextMatch, 'test-policy');
  expect(decisionMatch.appliedRules).toHaveLength(1);
  const contextNoMatch = createTestContext({ task: { requiredCapabilities: ['writing'] } });
  const decisionNoMatch = engine.evaluate(contextNoMatch, 'test-policy');
  expect(decisionNoMatch.appliedRules).toHaveLength(0);
}
function itShouldEvaluateGreaterThanOperator5() {
  const policy: Policy = {
    id: 'test-policy',
    version: '1.0.0',
    name: 'Test Policy',
    rules: [
      {
        id: 'gt-rule',
        name: 'Greater Than Rule',
        priority: 10,
        conditions: [{ field: 'task.priority', operator: 'greaterThan', value: 5 }],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  };
  engine.registerPolicy(policy);
  const contextMatch = createTestContext({ task: { priority: 10 } });
  const decisionMatch = engine.evaluate(contextMatch, 'test-policy');
  expect(decisionMatch.appliedRules).toHaveLength(1);
  const contextNoMatch = createTestContext({ task: { priority: 3 } });
  const decisionNoMatch = engine.evaluate(contextNoMatch, 'test-policy');
  expect(decisionNoMatch.appliedRules).toHaveLength(0);
}
function describeConditionEvaluation2() {
  it('should evaluate equals operator', itShouldEvaluateEqualsOperator3);
  it('should evaluate contains operator', itShouldEvaluateContainsOperator4);
  it('should evaluate greaterThan operator', itShouldEvaluateGreaterThanOperator5);
}
function describePolicyEngine0() {
  beforeEach(beforeEachBeforeEach1);
  describe('condition evaluation', describeConditionEvaluation2);
}
