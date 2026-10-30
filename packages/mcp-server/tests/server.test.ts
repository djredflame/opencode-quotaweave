/**
 * Tests for QuotaWeaveMcpServer
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { QuotaWeaveMcpServer } from '../src/server.js';
import { createQuotaWeaveMcpServer } from '../src/server.js';
import type { McpServerConfig } from '../src/types.js';
let server: QuotaWeaveMcpServer;
describe('QuotaWeaveMcpServer', describeQuotaWeaveMcpServer0);
function beforeEachBeforeEach1() {
  server = createQuotaWeaveMcpServer();
}
async function afterEachAfterEach2() {
  await server.stop();
}
function itShouldCreateServerWithDefaultConfig4() {
  const defaultServer = createQuotaWeaveMcpServer();
  expect(defaultServer.getConfig().mcp?.name).toBe('quotaweave');
  expect(defaultServer.isInitialized()).toBe(false);
}
async function itShouldInitializeServer5() {
  await server.initialize();
  expect(server.isInitialized()).toBe(true);
}
async function itShouldNotReInitialize6() {
  await server.initialize();
  await server.initialize();
  expect(server.isInitialized()).toBe(true);
}
function itShouldExposeCoreInstance7() {
  const core = server.getCore();
  expect(core).toBeDefined();
  expect(typeof core.getVersion).toBe('function');
}
function describeInitialization3() {
  it('should create server with default config', itShouldCreateServerWithDefaultConfig4);
  it('should initialize server', itShouldInitializeServer5);
  it('should not re-initialize', itShouldNotReInitialize6);
  it('should expose core instance', itShouldExposeCoreInstance7);
}
async function itShouldRegisterDiagnosticToolsWhenEnabled9() {
  const config: McpServerConfig = {
    mcp: {
      enableDiagnostics: true,
      enableQuotaTools: false,
      enableWorkflowTools: false,
      enableRoutingTools: false,
    },
  };
  const diagServer = createQuotaWeaveMcpServer(config);
  await diagServer.initialize();
  // Tools are registered internally
  expect(diagServer.isInitialized()).toBe(true);
  await diagServer.stop();
}
async function itShouldRegisterQuotaToolsWhenEnabled10() {
  const config: McpServerConfig = {
    mcp: {
      enableDiagnostics: false,
      enableQuotaTools: true,
      enableWorkflowTools: false,
      enableRoutingTools: false,
    },
  };
  const quotaServer = createQuotaWeaveMcpServer(config);
  await quotaServer.initialize();
  expect(quotaServer.isInitialized()).toBe(true);
  await quotaServer.stop();
}
function describeToolsRegistration8() {
  it('should register diagnostic tools when enabled', itShouldRegisterDiagnosticToolsWhenEnabled9);
  it('should register quota tools when enabled', itShouldRegisterQuotaToolsWhenEnabled10);
}
async function itShouldShutdownCleanly12() {
  await server.initialize();
  await server.stop();
  expect(server.isInitialized()).toBe(false);
}
function describeShutdown11() {
  it('should shutdown cleanly', itShouldShutdownCleanly12);
}
function describeQuotaWeaveMcpServer0() {
  beforeEach(beforeEachBeforeEach1);
  afterEach(afterEachAfterEach2);
  describe('initialization', describeInitialization3);
  describe('tools registration', describeToolsRegistration8);
  describe('shutdown', describeShutdown11);
}
