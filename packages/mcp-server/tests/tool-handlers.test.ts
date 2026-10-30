/** Exercise the registered MCP handlers without opening stdio or network transports. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createQuotaWeaveMcpServer, runMcpServer } from '../src/server.js';
import type { QuotaWeaveMcpServer } from '../src/server.js';
type Handler = (input: { params: { name: string } }) => Promise<unknown>;
const mocks = vi.hoisted(() => ({
  handlers: [] as Handler[],
  connect: vi.fn<() => Promise<void>>(),
  close: vi.fn<() => Promise<void>>(),
}));
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class {
    connect = mocks.connect;
    close = mocks.close;
    setRequestHandler(_schema: unknown, handler: Handler) {
      mocks.handlers.push(handler);
    }
  },
}));
let server: QuotaWeaveMcpServer;
beforeEach(() => {
  mocks.handlers.length = 0;
  vi.clearAllMocks();
  server = createQuotaWeaveMcpServer();
});
afterEach(async () => server.stop());
function handler(index: number): Handler {
  const value = mocks.handlers.at(index);
  if (!value) throw new Error('Expected a registered tool handler');
  return value;
}
it('registers handlers once, connects on start, and closes on stop', async () => {
  await server.initialize();
  await server.initialize();
  expect(mocks.handlers).toHaveLength(2);
  await server.start();
  expect(mocks.connect).toHaveBeenCalledTimes(1);
  expect(await handler(0)({ params: { name: '' } })).toMatchObject({
    tools: [{ name: 'health_check' }, { name: 'quota_status' }],
  });
  expect(await handler(1)({ params: { name: 'health_check' } })).toMatchObject({
    content: [{ type: 'json', json: { status: 'healthy' } }],
  });
});
it('exposes actual quota state and rejects unknown tool names', async () => {
  server.getCore().getQuotaManager().registerQuota({
    id: 'quota',
    name: 'Quota',
    type: 'requests',
    limit: 10,
    periodHours: 1,
    enabled: true,
  });
  await server.initialize();
  expect(await handler(1)({ params: { name: 'quota_status' } })).toMatchObject({
    content: [{ json: [{ modelId: 'quota', remaining: 10 }] }],
  });
  expect(() => handler(1)({ params: { name: 'missing' } })).toThrow('Unknown tool');
});
it.each(['http', 'websocket'] as const)(
  'reports unsupported %s transport explicitly',
  async (type) => {
    const alternate = createQuotaWeaveMcpServer({ mcp: { transport: { type } } });
    await expect(alternate.start()).rejects.toThrow('not yet implemented');
    await alternate.stop();
  },
);

it.each([false, true])(
  'cleans up CLI lifecycle once when close failure is %s',
  async (failClose) => {
    const signals = new Map<string, () => void>();
    const exit = vi.fn();
    const reportError = vi.fn();
    await runMcpServer(undefined, {
      once: (event, callback) => {
        signals.set(event, callback);
      },
      exit,
      reportError,
    });
    if (failClose) mocks.close.mockRejectedValueOnce(new Error('close failed'));
    signals.get('SIGINT')?.();
    signals.get('SIGTERM')?.();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(failClose ? 1 : 0);
    expect(reportError).toHaveBeenCalledTimes(failClose ? 1 : 0);
  },
);
it('retains default server options when only one MCP option is overridden', async () => {
  const alternate = createQuotaWeaveMcpServer({ mcp: { enableDiagnostics: false } });
  expect(alternate.getConfig().mcp).toMatchObject({
    name: 'quotaweave',
    version: '0.1.0',
    enableDiagnostics: false,
  });
  await alternate.stop();
});
