/**
 * MCP Server types for QuotaWeave
 */

import type { CoreConfig } from '@opencode-quotaweave/core';

/**
 * MCP Server configuration
 */
export interface McpServerConfig extends CoreConfig {
  /** MCP server configuration */
  mcp?: McpConfig;
}

/**
 * MCP-specific configuration
 */
export interface McpConfig {
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Transport configuration */
  transport?: TransportConfig;
  /** Enable diagnostic tools */
  enableDiagnostics?: boolean;
  /** Enable quota management tools */
  enableQuotaTools?: boolean;
  /** Enable workflow tools */
  enableWorkflowTools?: boolean;
  /** Enable routing tools */
  enableRoutingTools?: boolean;
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  /** Transport type */
  type: 'stdio' | 'http' | 'websocket';
  /** HTTP port (for http transport) */
  port?: number;
  /** HTTP host (for http transport) */
  host?: string;
  /** WebSocket path (for websocket transport) */
  path?: string;
}

/**
 * Tool call context
 */
export interface ToolCallContext {
  /** Request ID */
  requestId: string;
  /** Session ID */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tool result
 */
export interface ToolResult {
  /** Result content */
  content: ToolResultContent[];
  /** Whether the call was an error */
  isError?: boolean;
}

/**
 * Tool result content
 */
export type ToolResultContent =
  | { type: 'text'; text: string }
  | { type: 'json'; json: unknown }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; text: string } };

/**
 * Diagnostic info
 */
export interface DiagnosticInfo {
  /** Component name */
  component: string;
  /** Health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Details */
  details: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Quota info for tools
 */
export interface QuotaInfo {
  /** Model ID */
  modelId: string;
  /** Provider ID */
  providerId: string;
  /** Used quota */
  used: number;
  /** Total quota */
  total: number;
  /** Remaining quota */
  remaining: number;
  /** Usage percentage */
  usagePercent: number;
  /** Is warning */
  isWarning: boolean;
  /** Is critical */
  isCritical: boolean;
  /** Is exhausted */
  isExhausted: boolean;
}

/**
 * Routing info for tools
 */
export interface RoutingInfo {
  /** Request ID */
  requestId: string;
  /** Selected model */
  selectedModel: string;
  /** Provider */
  provider: string;
  /** Reason */
  reason: string;
  /** Confidence */
  confidence: number;
  /** Alternatives */
  alternatives: Array<{ model: string; provider: string }>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Workflow info for tools
 */
export interface WorkflowInfo {
  /** Execution ID */
  executionId: string;
  /** Workflow ID */
  workflowId: string;
  /** Status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Progress (0-1) */
  progress: number;
  /** Current step */
  currentStep?: string;
  /** Steps */
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    durationMs?: number;
  }>;
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
}
