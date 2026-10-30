/**
 * Policy engine types for QuotaWeave
 */

/**
 * Policy rule condition
 */
export interface PolicyCondition {
  /** Field to evaluate (e.g., 'task.type', 'model.capabilities') */
  field: string;
  /** Operator to apply */
  operator: PolicyOperator;
  /** Value to compare against */
  value: unknown;
}

/**
 * Policy operators
 */
export type PolicyOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn';

/**
 * Policy rule action
 */
export interface PolicyAction {
  /** Action type */
  type: PolicyActionType;
  /** Action parameters */
  params: Record<string, unknown>;
}

/**
 * Policy action types
 */
export type PolicyActionType =
  | 'allow'
  | 'deny'
  | 'requireApproval'
  | 'setModel'
  | 'setQuota'
  | 'setPriority'
  | 'addTag'
  | 'removeTag'
  | 'log'
  | 'notify';

/**
 * Policy rule
 */
export interface PolicyRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Rule priority (higher = evaluated first) */
  priority: number;
  /** Conditions that must all match */
  conditions: PolicyCondition[];
  /** Actions to execute when conditions match */
  actions: PolicyAction[];
  /** Whether rule is enabled */
  enabled: boolean;
  /** Rule metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete policy document
 */
export interface Policy {
  /** Unique policy identifier */
  id: string;
  /** Policy version */
  version: string;
  /** Human-readable policy name */
  name: string;
  /** Policy description */
  description?: string;
  /** Ordered list of rules */
  rules: PolicyRule[];
  /** Policy metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Policy evaluation decision
 */
export interface PolicyDecision {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Applied rules (in order of evaluation) */
  appliedRules: PolicyRule[];
  /** Actions to execute */
  actions: PolicyAction[];
  /** Denial reason if not allowed */
  denialReason: string | undefined;
  /** Required approvals if any */
  requiredApprovals: string[];
  /** Warnings generated during evaluation */
  warnings: string[];
  /** Evaluation metadata */
  metadata: Record<string, unknown>;
}

/**
 * Policy evaluation context
 */
export interface PolicyEvaluationContext {
  /** Task or request being evaluated */
  task: Record<string, unknown>;
  /** Available models */
  models: ModelInfo[];
  /** Current quota state */
  quota: QuotaState;
  /** User/session context */
  session: SessionContext;
  /** Custom context data */
  custom?: Record<string, unknown>;
}

/**
 * Model information for policy evaluation
 */
export interface ModelInfo {
  /** Model identifier */
  id: string;
  /** Provider name */
  provider: string;
  /** Model capabilities */
  capabilities: string[];
  /** Current quota usage */
  quotaUsage?: QuotaUsage;
  /** Model metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Quota usage information
 */
export interface QuotaUsage {
  /** Used quota units */
  used: number;
  /** Total quota units */
  total: number;
  /** Quota period end timestamp */
  periodEnd: number;
}

/**
 * Quota state for policy evaluation
 */
export interface QuotaState {
  /** Per-model quota usage */
  models: Record<string, QuotaUsage>;
  /** Global quota usage */
  global?: QuotaUsage;
}

/**
 * Session context for policy evaluation
 */
export interface SessionContext {
  /** Session identifier */
  sessionId: string;
  /** User identifier */
  userId?: string;
  /** Session tags */
  tags: string[];
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Policy engine configuration
 */
export interface PolicyEngineConfig {
  /** Default policy to apply when none matched */
  defaultPolicy?: string;
  /** Maximum policy evaluation depth */
  maxDepth?: number;
}
