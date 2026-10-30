import { configFileAccess } from '../src/config-file-access.js';
/**
 * State-preservation tests for the shared QuotaWeave dialog.
 *
 * These tests exercise the real dialog state with a mocked host context and
 * do not claim to replace interactive TUI checks.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'solid-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { useDialogState } from '../src/tui/dialog/useDialogState.js';
vi.mock('@opencode/plugin/tui', () => ({
  usePlugin: () => ({ ui: { dialog: { clear: () => undefined } } }),
}));
const testsDir = path.dirname(fileURLToPath(import.meta.url));
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
describe('dialog state preservation', describeDialogStatePreservation1);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itKeepsModelsFiltersSelectionAndScrollOffsets2() {
  createRoot((dispose) => {
    const state = useDialogState({
      session: { config, engine: createConfigRoutingEngine(config) },
      initialView: 'models',
    });
    state.setFilter({ searchQuery: 'model-2', statusFilter: 'enabled' });
    state.setSelectedModel('test/model-1');
    state.rememberScroll('modelList', 14);
    state.rememberScroll('modelDetail', 6);
    state.setView('routing');
    expect(state.view()).toBe('routing');
    state.setView('models');
    expect(state.filter()).toMatchObject({ searchQuery: 'model-2', statusFilter: 'enabled' });
    expect(state.selectedModel()?.id).toBe('test/model-1');
    expect(state.scrollPosition('modelList')).toBe(14);
    expect(state.scrollPosition('modelDetail')).toBe(6);
    dispose();
  });
}
function itKeepsRoutingCategorySelectionAndScrollOffsets3() {
  createRoot((dispose) => {
    const state = useDialogState({
      session: { config, engine: createConfigRoutingEngine(config) },
      initialView: 'routing',
    });
    expect(state.selectedCategory()).toBe('general');
    state.setSelectedCategory('vision');
    state.rememberScroll('routingList', 11);
    state.rememberScroll('routingDetail', 7);
    state.setView('overview');
    state.setView('routing');
    expect(state.selectedCategory()).toBe('vision');
    expect(state.scrollPosition('routingList')).toBe(11);
    expect(state.scrollPosition('routingDetail')).toBe(7);
    dispose();
  });
}
function itKeepsSimulationInputResultAndSectionAcross4() {
  createRoot((dispose) => {
    const state = useDialogState({
      session: { config, engine: createConfigRoutingEngine(config) },
      initialView: 'simulate',
      initialTask: 'debug this memory leak',
    });
    state.runSimulation();
    state.setSection('candidates');
    state.rememberScroll('simulationResult', 8);
    state.setView('system');
    expect(state.view()).toBe('system');
    state.setView('simulate');
    expect(state.simulation().task).toBe('debug this memory leak');
    expect(state.simulation().result).not.toBeNull();
    expect(state.simulation().section).toBe('candidates');
    expect(state.scrollPosition('simulationResult')).toBe(8);
    dispose();
  });
}
function describeDialogStatePreservation1() {
  it(
    'keeps models filters, selection and scroll offsets across tab switches',
    itKeepsModelsFiltersSelectionAndScrollOffsets2,
  );
  it(
    'keeps routing category selection and scroll offsets across tab switches',
    itKeepsRoutingCategorySelectionAndScrollOffsets3,
  );
  it(
    'keeps simulation input, result and section across tab switches',
    itKeepsSimulationInputResultAndSectionAcross4,
  );
}
