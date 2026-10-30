/**
 * Policy Engine for QuotaWeave
 *
 * Evaluates policies against request context to make routing and quota decisions.
 */

import type {
  Policy,
  PolicyAction,
  PolicyActionType,
  PolicyCondition,
  PolicyDecision,
  PolicyEngineConfig,
  PolicyEvaluationContext,
  PolicyOperator,
  PolicyRule,
} from './types.js';

/**
 * Default policy engine configuration
 */
const DEFAULT_CONFIG: Required<PolicyEngineConfig> = {
  defaultPolicy: 'default',
  maxDepth: 100,
};

/**
 * Policy evaluation engine
 */
export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private config: Required<PolicyEngineConfig>;

  constructor(config: PolicyEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a policy
   */
  registerPolicy(policy: Policy): void {
    this.validatePolicy(policy);
    this.policies.set(policy.id, policy);
  }

  /**
   * Unregister a policy
   */
  unregisterPolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * Get a registered policy
   */
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * List all registered policies
   */
  listPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Evaluate policies against context
   */
  evaluate(context: PolicyEvaluationContext, policyId?: string): PolicyDecision {
    const policy = policyId
      ? this.policies.get(policyId)
      : this.policies.get(this.config.defaultPolicy);

    if (!policy) {
      return this.createDefaultDecision(true);
    }

    return this.evaluatePolicy(policy, context);
  }

  /**
   * Evaluate a specific policy
   */
  private evaluatePolicy(policy: Policy, context: PolicyEvaluationContext): PolicyDecision {
    const appliedRules: PolicyRule[] = [];
    const actions: PolicyAction[] = [];
    const warnings: string[] = [];
    let allowed = true;
    let denialReason: string | undefined;

    // Sort rules by priority (highest first)
    const sortedRules = [...policy.rules]
      .filter((rule) => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        appliedRules.push(rule);
        actions.push(...rule.actions);

        // Check for deny action
        const denyAction = rule.actions.find((a) => a.type === 'deny');
        if (denyAction) {
          allowed = false;
          denialReason = policyText(
            denyAction.params.reason ?? `Rule "${rule.name}" denied the request`,
          );
          break;
        }

        // Check for requireApproval action
        const approvalAction = rule.actions.find((a) => a.type === 'requireApproval');
        if (approvalAction) {
          // Track required approvals (would be handled by caller)
          void approvalAction.params.type;
        }
      }
    }

    return {
      allowed,
      appliedRules,
      actions,
      denialReason,
      requiredApprovals: actions
        .filter((action) => action.type === 'requireApproval')
        .map((action) => policyText(action.params.type ?? 'default')),
      warnings,
      metadata: {
        policyId: policy.id,
        policyVersion: policy.version,
        evaluatedRules: appliedRules.length,
        totalRules: policy.rules.length,
      },
    };
  }

  /**
   * Evaluate conditions against context
   */
  private evaluateConditions(
    conditions: PolicyCondition[],
    context: PolicyEvaluationContext,
  ): boolean {
    return conditions.every((condition) => this.evaluateCondition(condition, context));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    return this.compareValues(fieldValue, condition.operator, condition.value);
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(field: string, context: PolicyEvaluationContext): unknown {
    const parts = field.split('.');
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Compare values using operator
   */
  private compareValues(left: unknown, operator: PolicyOperator, right: unknown): boolean {
    switch (operator) {
      case 'equals':
        return left === right;
      case 'notEquals':
        return left !== right;
      case 'contains':
        return Array.isArray(left) ? left.includes(right) : String(left).includes(String(right));
      case 'notContains':
        return Array.isArray(left) ? !left.includes(right) : !String(left).includes(String(right));
      case 'startsWith':
        return String(left).startsWith(String(right));
      case 'endsWith':
        return String(left).endsWith(String(right));
      case 'matches':
        return new RegExp(String(right)).test(String(left));
      case 'greaterThan':
        return Number(left) > Number(right);
      case 'lessThan':
        return Number(left) < Number(right);
      case 'greaterThanOrEqual':
        return Number(left) >= Number(right);
      case 'lessThanOrEqual':
        return Number(left) <= Number(right);
      case 'in':
        return Array.isArray(right) ? right.includes(left) : false;
      case 'notIn':
        return Array.isArray(right) ? !right.includes(left) : true;
      default:
        return false;
    }
  }

  /**
   * Validate policy structure
   */
  private validatePolicy(policy: Policy): void {
    if (!policy.id || typeof policy.id !== 'string') {
      throw new Error('Policy must have a valid id');
    }
    if (!policy.version || typeof policy.version !== 'string') {
      throw new Error('Policy must have a valid version');
    }
    if (!policy.name || typeof policy.name !== 'string') {
      throw new Error('Policy must have a valid name');
    }
    if (!Array.isArray(policy.rules)) {
      throw new Error('Policy must have a rules array');
    }

    for (const rule of policy.rules) {
      this.validateRule(rule);
    }
  }

  /**
   * Validate rule structure
   */
  private validateRule(rule: PolicyRule): void {
    if (!rule.id || typeof rule.id !== 'string') {
      throw new Error('Rule must have a valid id');
    }
    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error('Rule must have a valid name');
    }
    if (typeof rule.priority !== 'number') {
      throw new Error('Rule must have a numeric priority');
    }
    if (!Array.isArray(rule.conditions)) {
      throw new Error('Rule must have a conditions array');
    }
    if (!Array.isArray(rule.actions)) {
      throw new Error('Rule must have an actions array');
    }
    if (typeof rule.enabled !== 'boolean') {
      throw new Error('Rule must have a boolean enabled field');
    }

    for (const condition of rule.conditions) {
      this.validateCondition(condition);
    }

    for (const action of rule.actions) {
      this.validateAction(action);
    }
  }

  /**
   * Validate condition structure
   */
  private validateCondition(condition: PolicyCondition): void {
    if (!condition.field || typeof condition.field !== 'string') {
      throw new Error('Condition must have a valid field');
    }
    if (!this.isValidOperator(condition.operator)) {
      throw new Error(`Invalid operator: ${String(condition.operator)}`);
    }
  }

  /**
   * Validate action structure
   */
  private validateAction(action: PolicyAction): void {
    if (!this.isValidActionType(action.type)) {
      throw new Error(`Invalid action type: ${String(action.type)}`);
    }
    if (!action.params || typeof action.params !== 'object') {
      throw new Error('Action must have params object');
    }
  }

  /**
   * Check if operator is valid
   */
  private isValidOperator(operator: string): operator is PolicyOperator {
    const validOperators: PolicyOperator[] = [
      'equals',
      'notEquals',
      'contains',
      'notContains',
      'startsWith',
      'endsWith',
      'matches',
      'greaterThan',
      'lessThan',
      'greaterThanOrEqual',
      'lessThanOrEqual',
      'in',
      'notIn',
    ];
    return validOperators.includes(operator as PolicyOperator);
  }

  /**
   * Check if action type is valid
   */
  private isValidActionType(type: string): type is PolicyActionType {
    const validTypes: PolicyActionType[] = [
      'allow',
      'deny',
      'requireApproval',
      'setModel',
      'setQuota',
      'setPriority',
      'addTag',
      'removeTag',
      'log',
      'notify',
    ];
    return validTypes.includes(type as PolicyActionType);
  }

  /**
   * Create default allow decision
   */
  private createDefaultDecision(allowed: boolean): PolicyDecision {
    return {
      allowed,
      appliedRules: [],
      actions: [],
      denialReason: undefined,
      requiredApprovals: [],
      warnings: [],
      metadata: {
        policyId: 'default',
        evaluatedRules: 0,
        totalRules: 0,
      },
    };
  }
}

/**
 * Create a default policy engine with basic policies
 */
export function createDefaultPolicyEngine(): PolicyEngine {
  const engine = new PolicyEngine();

  // Register a basic default policy
  engine.registerPolicy({
    id: 'default',
    version: '1.0.0',
    name: 'Default Policy',
    description: 'Default allow-all policy',
    rules: [
      {
        id: 'allow-all',
        name: 'Allow All',
        description: 'Allow all requests by default',
        priority: 0,
        conditions: [],
        actions: [{ type: 'allow', params: {} }],
        enabled: true,
      },
    ],
  });

  return engine;
}

function policyText(value: unknown): string {
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
