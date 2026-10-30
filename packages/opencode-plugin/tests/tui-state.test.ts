import { configFileAccess } from '../src/config-file-access.js';
/**
 * Unit tests for QuotaWeave UI state and data helpers.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL_FILTER,
  backTarget,
  buildSimulationRequest,
  categoriesForModel,
  collectProviders,
  cycleSimulationSection,
  filterModels,
  findModel,
  hasSplitLayout,
  hasWideLayout,
  isCategoryFilter,
  isRunnableTask,
  isSimulationSection,
  isStatusFilter,
  resolveContentMaxWidth,
  resolveDialogSize,
  resolveLayoutMode,
  resolveNavigationDensity,
  resolveShellHeight,
} from '../src/tui/state.js';
import { VIEW_TABS, isQuotaWeaveView, neighbourTab, nextView, viewTab } from '../src/tui/tabs.js';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
describe('model filtering', describeModelFiltering1);
describe('simulation request', describeSimulationRequest5);
describe('navigation and lookup helpers', describeNavigationAndLookupHelpers9);
describe('tab and responsive layout state', describeTabAndResponsiveLayoutState14);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itReturnsEveryModelForTheDefaultFilter2() {
  expect(filterModels(config, DEFAULT_MODEL_FILTER)).toHaveLength(2);
}
function itMatchesModelIDsProvidersDisplayNamesAnd3() {
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, searchQuery: 'model-2' })).toHaveLength(1);
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, searchQuery: 'test' })).toHaveLength(2);
  expect(
    filterModels(config, { ...DEFAULT_MODEL_FILTER, searchQuery: 'Test Model 1' }),
  ).toHaveLength(1);
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, searchQuery: 'writing' })).toHaveLength(1);
}
function itFiltersByEnabledStateAndRoutingCategory4() {
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, statusFilter: 'enabled' })).toHaveLength(
    2,
  );
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, statusFilter: 'disabled' })).toHaveLength(
    0,
  );
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, categoryFilter: 'coding' })).toHaveLength(
    1,
  );
  expect(filterModels(config, { ...DEFAULT_MODEL_FILTER, categoryFilter: 'general' })).toHaveLength(
    2,
  );
}
function describeModelFiltering1() {
  it('returns every model for the default filter', itReturnsEveryModelForTheDefaultFilter2);
  it(
    'matches model IDs, providers, display names, and capabilities',
    itMatchesModelIDsProvidersDisplayNamesAnd3,
  );
  it('filters by enabled state and routing category', itFiltersByEnabledStateAndRoutingCategory4);
}
function itTrimsTheTaskAndLeavesTheCategory6() {
  const request = buildSimulationRequest('  debug this memory leak  ');
  expect(request).toEqual({ task: 'debug this memory leak' });
  expect(request.category).toBeUndefined();
}
function itTreatsWhitespaceOnlyTasksAsNotRunnable7() {
  expect(isRunnableTask('   ')).toBe(false);
  expect(isRunnableTask('review this module')).toBe(true);
}
function itUsesDeterministicLocalInferenceFromTheRouting8() {
  const engine = createConfigRoutingEngine(config);
  const first = engine.simulate(buildSimulationRequest('debug this memory leak'));
  const second = engine.simulate(buildSimulationRequest('debug this memory leak'));
  expect(first.category).toBe('coding');
  expect(first.metadata.heuristicCategory).toBe(true);
  expect(first.selectedModel?.model.id).toBe(second.selectedModel?.model.id);
  expect(first.candidates.length).toBe(second.candidates.length);
}
function describeSimulationRequest5() {
  it(
    'trims the task and leaves the category unset for host inference',
    itTrimsTheTaskAndLeavesTheCategory6,
  );
  it('treats whitespace-only tasks as not runnable', itTreatsWhitespaceOnlyTasksAsNotRunnable7);
  it(
    'uses deterministic local inference from the routing engine',
    itUsesDeterministicLocalInferenceFromTheRouting8,
  );
}
function itClosesFromTheOverviewAndReturnsTo10() {
  expect(backTarget('overview')).toBe('close');
  expect(backTarget('models')).toBe('overview');
  expect(backTarget('routing')).toBe('overview');
  expect(backTarget('policies')).toBe('overview');
  expect(backTarget('simulate')).toBe('overview');
  expect(backTarget('system')).toBe('overview');
}
function itRecognizesViewSectionStatusAndCategoryIdentifiers11() {
  expect(VIEW_TABS.every((tab) => isQuotaWeaveView(tab.id))).toBe(true);
  expect(isQuotaWeaveView('models')).toBe(true);
  expect(isQuotaWeaveView('routing')).toBe(true);
  expect(isQuotaWeaveView('settings')).toBe(false);
  expect(isSimulationSection('decision')).toBe(true);
  expect(isSimulationSection('unknown')).toBe(false);
  expect(isStatusFilter('disabled')).toBe(true);
  expect(isStatusFilter('unknown')).toBe(false);
  expect(isCategoryFilter('coding', config)).toBe(true);
  expect(isCategoryFilter('vision', config)).toBe(true);
}
function itWrapsResultSectionNavigation12() {
  expect(cycleSimulationSection('summary', -1)).toBe('details');
  expect(cycleSimulationSection('details', 1)).toBe('summary');
}
function itAggregatesProvidersAndCategoryMembership13() {
  expect(collectProviders(config.models)).toEqual([
    { name: 'test', modelCount: 2, enabledCount: 2 },
  ]);
  expect(categoriesForModel(config, 'test/model-1').enabled.map((item) => item.id)).toEqual([
    'general',
    'coding',
  ]);
  expect(categoriesForModel(config, 'test/model-2').enabled.map((item) => item.id)).toEqual([
    'general',
  ]);
  expect(findModel(config, 'test/model-1')?.provider).toBe('test');
  expect(findModel(config, 'missing/model')).toBeNull();
  expect(findModel(config, null)).toBeNull();
}
function describeNavigationAndLookupHelpers9() {
  it(
    'closes from the overview and returns to the overview from other views',
    itClosesFromTheOverviewAndReturnsTo10,
  );
  it(
    'recognizes view, section, status, and category identifiers',
    itRecognizesViewSectionStatusAndCategoryIdentifiers11,
  );
  it('wraps result section navigation', itWrapsResultSectionNavigation12);
  it('aggregates providers and category membership', itAggregatesProvidersAndCategoryMembership13);
}
function itDefinesExactlyTheSixSharedTabsIn15() {
  expect(VIEW_TABS.map((tab) => tab.id)).toEqual([
    'overview',
    'models',
    'routing',
    'policies',
    'simulate',
    'system',
  ]);
}
function itKeepsStableUniqueTabIdsAndNonempty16() {
  const ids = VIEW_TABS.map((tab) => tab.id);
  expect(new Set(ids).size).toBe(VIEW_TABS.length);
  expect(ids).toEqual(['overview', 'models', 'routing', 'policies', 'simulate', 'system']);
  expect(VIEW_TABS.every((tab) => tab.label.trim().length > 0)).toBe(true);
  expect(viewTab('routing').label).toBe('Routing');
  expect(viewTab('policies').label).toBe('Policies');
  expect(viewTab('system').label).toBe('System');
}
function itMarksOnlyThePlannedDestinationsAsPlaceholders17() {
  expect(VIEW_TABS.filter((tab) => tab.placeholder).map((tab) => tab.id)).toEqual([]);
  expect(viewTab('routing').description).toBe(
    'Routing categories, model selection strategies and routing configuration.',
  );
  expect(viewTab('policies').description).toBe(
    'Cost constraints, free-only rules, cooldown configuration and shadow mode settings.',
  );
  expect(viewTab('system').description).toBe(
    'Agent Mesh configuration, plugin integration and runtime diagnostics.',
  );
}
function itCyclesEveryTabForwardAndBackwardWith18() {
  expect(nextView('overview', 1)).toBe('models');
  expect(nextView('models', 1)).toBe('routing');
  expect(nextView('routing', 1)).toBe('policies');
  expect(nextView('policies', 1)).toBe('simulate');
  expect(nextView('simulate', 1)).toBe('system');
  expect(nextView('system', 1)).toBe('overview');
  expect(nextView('overview', -1)).toBe('system');
  expect(nextView('system', -1)).toBe('simulate');
}
function itNavigatesTheTabBarAcrossValidBoundaries19() {
  expect(neighbourTab(VIEW_TABS, 'overview', 1)).toBe('models');
  expect(neighbourTab(VIEW_TABS, 'system', 1)).toBe('overview');
  expect(neighbourTab(VIEW_TABS, 'overview', -1)).toBe('system');
  expect(neighbourTab(VIEW_TABS, 'models', -1)).toBe('overview');
  expect(neighbourTab(VIEW_TABS, 'unknown', 1)).toBe('overview');
  expect(neighbourTab(VIEW_TABS, 'unknown', -1)).toBe('system');
  expect(neighbourTab([], 'overview', 1)).toBeNull();
}
function itChoosesAHostDialogWidthFromTerminal20() {
  expect(resolveDialogSize(150)).toBe('xlarge');
  expect(resolveDialogSize(120)).toBe('large');
  expect(resolveDialogSize(90)).toBe('medium');
}
function itClassifiesDesktopFirstLayoutWidths21() {
  expect(resolveLayoutMode(90)).toBe('compact');
  expect(resolveLayoutMode(100)).toBe('standard');
  expect(resolveLayoutMode(139)).toBe('standard');
  expect(resolveLayoutMode(140)).toBe('desktop');
  expect(resolveLayoutMode(179)).toBe('desktop');
  expect(resolveLayoutMode(180)).toBe('wide');
  expect(hasWideLayout(150)).toBe(true);
  expect(hasWideLayout(120)).toBe(false);
  expect(hasSplitLayout(100)).toBe(true);
  expect(hasSplitLayout(90)).toBe(false);
}
function itUsesCompactNavigationBelow100Columns22() {
  expect(resolveNavigationDensity(99)).toBe('compact');
  expect(resolveNavigationDensity(100)).toBe('comfortable');
  expect(resolveNavigationDensity(180)).toBe('comfortable');
}
function itConstrainsContentWidthOnlyOnUltrawideTerminals23() {
  expect(resolveContentMaxWidth(150)).toBe(150);
  expect(resolveContentMaxWidth(180)).toBe(132);
  expect(resolveContentMaxWidth(240)).toBe(132);
}
function itFillsTheHostViewportWithoutExceedingIt24() {
  expect(resolveShellHeight(46)).toBe(40);
  expect(resolveShellHeight(24)).toBe(18);
  expect(resolveShellHeight(10)).toBe(8);
  expect(resolveShellHeight(5)).toBe(5);
}
function describeTabAndResponsiveLayoutState14() {
  it('defines exactly the six shared tabs in display order', itDefinesExactlyTheSixSharedTabsIn15);
  it('keeps stable, unique tab ids and nonempty labels', itKeepsStableUniqueTabIdsAndNonempty16);
  it(
    'marks only the planned destinations as placeholders',
    itMarksOnlyThePlannedDestinationsAsPlaceholders17,
  );
  it(
    'cycles every tab forward and backward with wraparound',
    itCyclesEveryTabForwardAndBackwardWith18,
  );
  it('navigates the tab bar across valid boundaries', itNavigatesTheTabBarAcrossValidBoundaries19);
  it('chooses a host dialog width from terminal width', itChoosesAHostDialogWidthFromTerminal20);
  it('classifies desktop-first layout widths', itClassifiesDesktopFirstLayoutWidths21);
  it('uses compact navigation below 100 columns', itUsesCompactNavigationBelow100Columns22);
  it(
    'constrains content width only on ultrawide terminals',
    itConstrainsContentWidthOnlyOnUltrawideTerminals23,
  );
  it('fills the host viewport without exceeding it', itFillsTheHostViewportWithoutExceedingIt24);
}
