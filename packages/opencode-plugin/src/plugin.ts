import { configFileAccess } from './config-file-access.js';
/**
 * QuotaWeave OpenCode Plugin
 *
 * Main plugin class that integrates with OpenCode 2.
 */

import type {
  ModelCandidate,
  QuotaWeaveCore,
  ResolvedRoutingConfig,
  RouteRequest,
  WorkflowExecutionRequest,
  WorkflowExecutionResult,
} from '@opencode-quotaweave/core';
import { createQuotaWeaveCore, findAndLoadConfig, resolveConfig } from '@opencode-quotaweave/core';
import * as path from 'node:path';
import type {
  ModelSelectionRequest,
  ModelSelectionResponse,
  PluginConfig,
  PluginContext,
  QuotaStatusResponse,
} from './types.js';

/**
 * QuotaWeave OpenCode Plugin
 */
export class QuotaWeavePlugin {
  private core: QuotaWeaveCore;
  private config: PluginConfig;
  private resolvedRoutingConfig: ResolvedRoutingConfig | null = null;
  private initialized = false;
  private configPath: string | null = null;

  constructor(config: PluginConfig = {}) {
    this.config = {
      opencode: {
        autoRoute: true,
        enableQuotaTracking: true,
        enableWorkflows: true,
        ...config.opencode,
      },
      ...config,
    };

    this.core = createQuotaWeaveCore(this.config);
  }

  /**
   * Initialize the plugin and load routing configuration
   */
  async initialize(context: PluginContext): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load configuration from project root or specified path
    const projectRoot = context.cwd ?? process.cwd();

    // Check for explicit config path override (e.g., QUOTAWEAVE_CONFIG_PATH)
    const configPathEnv = process.env.QUOTAWEAVE_CONFIG_PATH;
    this.configPath = configPathEnv
      ? path.resolve(projectRoot, configPathEnv)
      : path.join(projectRoot, 'router.json');

    // For local development in the QuotaWeave repo, fall back to dev.route.json
    // This is a project-scoped default that only applies when no explicit config is provided
    // and we're in the QuotaWeave repository (detected by presence of dev.route.json)
    const configPathsToTry: string[] = [this.configPath];
    if (!configPathEnv) {
      const devConfigPath = path.join(projectRoot, 'dev.route.json');
      configPathsToTry.push(devConfigPath);
    }

    let configLoaded = false;
    for (const configPath of configPathsToTry) {
      try {
        const routingConfig = await findAndLoadConfig(projectRoot, configPath, configFileAccess);
        this.resolvedRoutingConfig = resolveConfig(routingConfig.global, routingConfig.project);
        this.configPath = configPath;

        // Set the resolved config in the core
        this.core.setRoutingConfig(this.resolvedRoutingConfig);
        configLoaded = true;
        break;
      } catch {
        // Continue to next config path
        continue;
      }
    }

    if (!configLoaded) {
      // If config loading fails, log but don't fail initialization
      // Core will fail closed on routing requests without config
      console.warn('[QuotaWeave] Failed to load routing configuration from any source');
    }

    this.initialized = true;
  }

  /**
   * Select best model for a task using ConfigRoutingEngine (authoritative)
   */
  async selectModel(request: ModelSelectionRequest): Promise<ModelSelectionResponse> {
    const models: ModelCandidate[] = [];
    const task: RouteRequest['task'] = {
      type: 'general',
      description: request.task,
      requiredCapabilities: request.requiredCapabilities ?? [],
    };

    if (request.preferredModels !== undefined) {
      task.preferredProviders = request.preferredModels;
    }
    if (request.excludedModels !== undefined) {
      task.excludedProviders = request.excludedModels;
    }
    if (request.maxCost !== undefined) {
      task.maxCost = request.maxCost;
    }

    const routeRequest: RouteRequest = {
      task,
      availableModels: models,
      context: request.context,
    };

    const result = await this.core.route(routeRequest);

    if (!result.selectedModel) {
      throw new Error(result.reason ?? 'No suitable model found');
    }

    return {
      modelId: result.selectedModel.id,
      providerId: result.selectedModel.provider,
      reason: result.reason,
      confidence: result.confidence,
      alternatives: result.alternatives.map((m: ModelCandidate) => ({
        modelId: m.id,
        providerId: m.provider,
      })),
    };
  }

  /**
   * Get quota status
   */
  getQuotaStatus(_context: PluginContext): Promise<QuotaStatusResponse> {
    void _context;
    return Promise.resolve({ models: {} });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, unknown>,
    context: PluginContext,
  ): Promise<WorkflowExecutionResult> {
    const request: WorkflowExecutionRequest = {
      workflowId,
      input,
      context,
    };

    return Promise.resolve(this.core.executeWorkflow(request));
  }

  /**
   * Get the core instance
   */
  getCore(): QuotaWeaveCore {
    return this.core;
  }

  /**
   * Get plugin configuration
   */
  getConfig(): PluginConfig {
    return this.config;
  }

  /**
   * Get resolved routing configuration
   */
  getRoutingConfig(): ResolvedRoutingConfig | null {
    return this.resolvedRoutingConfig;
  }

  /**
   * Reload configuration from disk
   */
  async reloadConfig(projectRoot?: string): Promise<void> {
    const root = projectRoot ?? (this.configPath ? path.dirname(this.configPath) : process.cwd());

    // Check for explicit config path override (e.g., QUOTAWEAVE_CONFIG_PATH)
    const configPathEnv = process.env.QUOTAWEAVE_CONFIG_PATH;
    const configPath = configPathEnv
      ? path.resolve(root, configPathEnv)
      : path.join(root, 'router.json');

    const routingConfig = await findAndLoadConfig(root, configPath, configFileAccess);
    this.resolvedRoutingConfig = resolveConfig(routingConfig.global, routingConfig.project);
    this.core.setRoutingConfig(this.resolvedRoutingConfig);
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the plugin
   */
  shutdown(): void {
    this.core.shutdown();
    this.initialized = false;
  }
}

/**
 * Create a QuotaWeave plugin instance
 */
export function createQuotaWeavePlugin(config?: PluginConfig): QuotaWeavePlugin {
  return new QuotaWeavePlugin(config);
}
