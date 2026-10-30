/**
 * QuotaWeave MCP Server
 *
 * Main server class that exposes diagnostic and support tools via MCP.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { QuotaWeaveCore } from '@opencode-quotaweave/core';
import { createQuotaWeaveCore } from '@opencode-quotaweave/core';
import type { McpServerConfig } from './types.js';

/**
 * QuotaWeave MCP Server
 */
export class QuotaWeaveMcpServer {
  private server: Server;
  private core: QuotaWeaveCore;
  private config: McpServerConfig;
  private initialized = false;

  constructor(config: McpServerConfig = {}) {
    this.config = {
      ...config,
      mcp: {
        name: 'quotaweave',
        version: '0.1.0',
        transport: { type: 'stdio' },
        enableDiagnostics: true,
        enableQuotaTools: true,
        enableWorkflowTools: true,
        enableRoutingTools: true,
        ...config.mcp,
      },
    };

    this.core = createQuotaWeaveCore(this.config);
    this.server = new Server(
      {
        name: this.config.mcp!.name!,
        version: this.config.mcp!.version!,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Register basic tools
    this.registerTools();

    this.initialized = true;

    return Promise.resolve();
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    const transport = this.createTransport();
    await this.server.connect(transport);
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
    } finally {
      this.core.shutdown();
      this.initialized = false;
    }
  }

  /**
   * Get the core instance
   */
  getCore(): QuotaWeaveCore {
    return this.core;
  }

  /**
   * Get server configuration
   */
  getConfig(): McpServerConfig {
    return this.config;
  }

  /**
   * Check if server is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Create transport based on configuration
   */
  private createTransport() {
    const transportConfig = this.config.mcp!.transport!;

    switch (transportConfig.type) {
      case 'stdio':
        return new StdioServerTransport();
      case 'http':
        throw new Error('HTTP transport not yet implemented');
      case 'websocket':
        throw new Error('WebSocket transport not yet implemented');
      default:
        throw new Error(`Unknown transport type: ${(transportConfig as { type: string }).type}`);
    }
  }

  /**
   * Register basic tools
   */
  private registerTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) =>
      this.callTool(request.params.name),
    );
  }
  private callTool(name: string) {
    if (name === 'health_check') {
      return Promise.resolve({
        content: [
          {
            type: 'json',
            json: {
              status: 'healthy',
              timestamp: Date.now(),
              components: [],
            },
          },
        ],
      });
    }

    if (name === 'quota_status') {
      const states = this.core.getQuotaManager().getAllQuotaStates();
      return Promise.resolve({
        content: [
          {
            type: 'json',
            json: states.map(
              (s: {
                configId: string;
                used: number;
                limit: number;
                remaining: number;
                usagePercent: number;
                isWarning: boolean;
                isCritical: boolean;
                isExhausted: boolean;
              }) => ({
                modelId: s.configId,
                providerId: 'core',
                used: s.used,
                total: s.limit,
                remaining: s.remaining,
                usagePercent: s.usagePercent,
                isWarning: s.isWarning,
                isCritical: s.isCritical,
                isExhausted: s.isExhausted,
              }),
            ),
          },
        ],
      });
    }

    throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Create a QuotaWeave MCP server instance
 */
export function createQuotaWeaveMcpServer(config?: McpServerConfig): QuotaWeaveMcpServer {
  return new QuotaWeaveMcpServer(config);
}

/**
 * Run the MCP server (for CLI usage)
 */
export async function runMcpServer(
  config?: McpServerConfig,
  lifecycle: ServerLifecycle = processLifecycle,
): Promise<void> {
  const server = createQuotaWeaveMcpServer(config);

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    void server.stop().then(
      () => lifecycle.exit(0),
      () => {
        lifecycle.reportError('QuotaWeave server shutdown failed.\n');
        lifecycle.exit(1);
      },
    );
  };
  lifecycle.once('SIGINT', shutdown);
  lifecycle.once('SIGTERM', shutdown);

  await server.start();
}

const tools = [
  {
    name: 'health_check',
    description: 'Check overall system health',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'quota_status',
    description: 'Get quota status for all models',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export interface ServerLifecycle {
  once(event: 'SIGINT' | 'SIGTERM', handler: () => void): void;
  exit(code: number): void;
  reportError(message: string): void;
}
const processLifecycle: ServerLifecycle = {
  once(event, handler) {
    process.once(event, handler);
  },
  exit(code) {
    process.exit(code);
  },
  reportError(message) {
    process.stderr.write(message);
  },
};
