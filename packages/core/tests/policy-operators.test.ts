import { expect, it } from 'vitest';
import { PolicyEngine } from '../src/policy/engine.js';
import type {
  PolicyAction,
  PolicyCondition,
  PolicyEvaluationContext,
  PolicyOperator,
} from '../src/policy/types.js';

function evaluate(
  condition: PolicyCondition,
  value: unknown,
  actions: PolicyAction[] = [{ type: 'deny', params: {} }],
) {
  const engine = new PolicyEngine();
  engine.registerPolicy({
    id: 'sample',
    version: '1',
    name: 'Sample',
    rules: [
      { id: 'rule', name: 'Rule', priority: 1, conditions: [condition], actions, enabled: true },
    ],
  });
  const context: PolicyEvaluationContext = {
    task: { value },
    models: [],
    quota: { models: {}, global: { used: 0, total: 100, periodEnd: 1 } },
    session: { sessionId: 'test', tags: [] },
  };
  return engine.evaluate(context, 'sample');
}
const cases: [PolicyOperator, unknown, unknown, boolean][] = [
  ['notEquals', 'a', 'b', true],
  ['contains', 'alphabet', 'pha', true],
  ['notContains', ['a'], 'b', true],
  ['notContains', 'alpha', 'z', true],
  ['startsWith', 'alpha', 'al', true],
  ['endsWith', 'alpha', 'ha', true],
  ['matches', 'alpha', '^al', true],
  ['greaterThan', 3, 2, true],
  ['lessThan', 1, 2, true],
  ['greaterThanOrEqual', 2, 2, true],
  ['lessThanOrEqual', 2, 2, true],
  ['in', 'a', ['a'], true],
  ['in', 'a', 'a', false],
  ['notIn', 'b', ['a'], true],
  ['notIn', 'b', null, true],
  ['contains', ['a'], 'b', false],
  ['equals', 'a', 'b', false],
];
it.each(cases)(
  'evaluates %s without coercing the decision contract',
  (operator, left, right, matches) => {
    const decision = evaluate({ field: 'task.value', operator, value: right }, left);
    expect(decision.allowed).toBe(!matches);
    expect(decision.appliedRules).toHaveLength(matches ? 1 : 0);
  },
);
it.each([null, undefined, 42, {}])('handles missing nested policy values %j', (value) => {
  expect(
    evaluate({ field: 'task.value.missing', operator: 'equals', value: undefined }, value).allowed,
  ).toBe(false);
});
it('serializes structured denial and approval metadata deliberately', () => {
  const condition: PolicyCondition = { field: 'task.value', operator: 'equals', value: 'x' };
  expect(
    evaluate(condition, 'x', [{ type: 'deny', params: { reason: { code: 'blocked' } } }])
      .denialReason,
  ).toBe('{"code":"blocked"}');
  expect(
    evaluate(condition, 'x', [
      { type: 'requireApproval', params: { type: { category: 'review' } } },
    ]).requiredApprovals,
  ).toEqual(['{"category":"review"}']);
});
