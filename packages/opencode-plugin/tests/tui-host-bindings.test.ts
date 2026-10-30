import { configFileAccess } from '../src/config-file-access.js';
/**
 * Integration tests for the host UI bindings.
 *
 * These tests exercise the command layer and native dialog binding with a
 * mocked OpenCode host. They do not claim to replace interactive TUI checks.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import type {
  DialogOptions,
  KeymapCommand,
  KeymapLayer,
  ToastOptions,
} from '@opencode/plugin/tui/context';
import type { JSX } from '@opentui/solid';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpenDashboard } from '../src/tui/commands.js';
import { createCommands } from '../src/tui/commands.js';
import { openQuotaWeave } from '../src/tui/open.js';
import { setupQuotaWeave } from '../src/tui/setup.js';
import type { QuotaWeaveHost } from '../src/tui/types.js';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
interface HostMocks {
  readonly host: QuotaWeaveHost;
  readonly show: ReturnType<
    typeof vi.fn<(render: () => JSX.Element, onClose?: () => void) => void>
  >;
  readonly set: ReturnType<typeof vi.fn<(options: DialogOptions) => void>>;
  readonly clear: ReturnType<typeof vi.fn<() => void>>;
  readonly toast: ReturnType<typeof vi.fn<(options: ToastOptions) => void>>;
  readonly layer: ReturnType<typeof vi.fn<(factory: () => KeymapLayer) => void>>;
  readonly factory: () => (() => KeymapLayer) | undefined;
}
function createHost(): HostMocks {
  let captured: (() => KeymapLayer) | undefined;
  const show = vi.fn<(render: () => JSX.Element, onClose?: () => void) => void>();
  const set = vi.fn<(options: DialogOptions) => void>();
  const clear = vi.fn<() => void>();
  const toast = vi.fn<(options: ToastOptions) => void>();
  const layer = vi.fn<(factory: () => KeymapLayer) => void>((factory) => {
    captured = factory;
  });
  return {
    host: {
      location: { directory: testsDir },
      ui: { dialog: { show, set, clear }, toast: { show: toast } },
      keymap: { layer },
    },
    show,
    set,
    clear,
    toast,
    layer,
    factory: () => captured,
  };
}
function findCommand(commands: readonly KeymapCommand[], id: string): KeymapCommand {
  const command = commands.find((item) => item.id === id);
  if (!command) throw new Error(`Missing command: ${id}`);
  return command;
}
async function runCommand(
  commands: readonly KeymapCommand[],
  id: string,
  input?: string,
): Promise<void> {
  await findCommand(commands, id).run?.(input);
}
describe('native dialog binding', describeNativeDialogBinding1);
describe('command layer', describeCommandLayer3);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itOpensTheSharedDialogWithTheHost2() {
  const mocks = createHost();
  openQuotaWeave(
    mocks.host,
    { config, engine: createConfigRoutingEngine(config) },
    { initialView: 'overview' },
  );
  expect(mocks.show).toHaveBeenCalledTimes(1);
  expect(typeof mocks.show.mock.calls[0]?.[0]).toBe('function');
  expect(mocks.set).toHaveBeenCalledWith({ size: 'xlarge', centered: true });
  expect(mocks.clear).not.toHaveBeenCalled();
}
function describeNativeDialogBinding1() {
  it(
    'opens the shared dialog with the host-owned size and centering',
    itOpensTheSharedDialogWithTheHost2,
  );
}
function beforeEachBeforeEach4() {
  vi.clearAllMocks();
}
async function itRegistersTheFourSlashAndPaletteCommands5() {
  const mocks = createHost();
  await setupQuotaWeave(mocks.host, { loadConfig: () => Promise.resolve(config) });
  expect(mocks.layer).toHaveBeenCalledTimes(1);
  const factory = mocks.factory();
  if (!factory) throw new Error('Command layer factory was not captured');
  const layer = factory();
  const commands = layer.commands ?? [];
  expect(layer.mode).toBe('global');
  expect(commands.map((command) => command.id)).toEqual([
    'quotaweave.route',
    'quotaweave.route.status',
    'quotaweave.route.models',
    'quotaweave.route.simulate',
  ]);
  expect(commands.every((command) => command.palette === true)).toBe(true);
  expect(findCommand(commands, 'quotaweave.route').slash).toEqual({ name: 'route' });
  expect(findCommand(commands, 'quotaweave.route.status').slash).toEqual({
    name: 'route-status',
  });
  expect(findCommand(commands, 'quotaweave.route.models').slash).toEqual({
    name: 'route-models',
  });
  expect(findCommand(commands, 'quotaweave.route.simulate').slash).toEqual({
    name: 'route-simulate',
    arguments: true,
  });
  expect(commands.some((command) => command.bind === 'escape')).toBe(false);
}
async function itRoutesEveryCommandThroughTheSameDialog6() {
  const mocks = createHost();
  const open = vi.fn<OpenDashboard>();
  const commands = createCommands({
    host: mocks.host,
    getSession: () => ({ config, engine: createConfigRoutingEngine(config) }),
    open,
  });
  await runCommand(commands, 'quotaweave.route');
  await runCommand(commands, 'quotaweave.route.status');
  await runCommand(commands, 'quotaweave.route.models');
  await runCommand(commands, 'quotaweave.route.simulate');
  expect(open).toHaveBeenCalledTimes(4);
  expect(open.mock.calls.map((call) => call[2].initialView)).toEqual([
    'overview',
    'overview',
    'models',
    'simulate',
  ]);
}
async function itPassesPrefilledSimulationArgumentsWithoutChangingThe7() {
  const mocks = createHost();
  const open = vi.fn<OpenDashboard>();
  const commands = createCommands({
    host: mocks.host,
    getSession: () => ({ config, engine: createConfigRoutingEngine(config) }),
    open,
  });
  await runCommand(commands, 'quotaweave.route.simulate', '  debug this memory leak  ');
  expect(open).toHaveBeenCalledWith(mocks.host, expect.objectContaining({ config }), {
    initialView: 'simulate',
    initialTask: 'debug this memory leak',
  });
}
async function itWarnsInsteadOfOpeningWhenConfigurationIs8() {
  const mocks = createHost();
  const open = vi.fn<OpenDashboard>();
  const commands = createCommands({ host: mocks.host, getSession: () => null, open });
  await runCommand(commands, 'quotaweave.route');
  expect(open).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith({
    message: 'QuotaWeave: no routing configuration loaded',
    variant: 'warning',
  });
}
async function itStillRegistersCommandsWhenStartupConfigurationIs9() {
  const mocks = createHost();
  await setupQuotaWeave(mocks.host, { loadConfig: () => Promise.resolve(null) });
  expect(mocks.toast).toHaveBeenCalledWith({
    message: 'QuotaWeave: no routing configuration found',
    variant: 'warning',
  });
  expect(mocks.layer).toHaveBeenCalledTimes(1);
}
function describeCommandLayer3() {
  beforeEach(beforeEachBeforeEach4);
  it(
    'registers the four slash and palette commands in one global layer',
    itRegistersTheFourSlashAndPaletteCommands5,
  );
  it(
    'routes every command through the same dialog implementation',
    itRoutesEveryCommandThroughTheSameDialog6,
  );
  it(
    'passes prefilled simulation arguments without changing the task text',
    itPassesPrefilledSimulationArgumentsWithoutChangingThe7,
  );
  it(
    'warns instead of opening when configuration is unavailable',
    itWarnsInsteadOfOpeningWhenConfigurationIs8,
  );
  it(
    'still registers commands when startup configuration is missing',
    itStillRegistersCommandsWhenStartupConfigurationIs9,
  );
}
