import { configFileAccess } from '../src/config-file-access.js';
/**
 * Unit tests for read-only Overview and Routing selectors.
 */
import {
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ROUTING_CATEGORY_IDS,
  buildCategoryPools,
  collectRoutingWarnings,
  initialRoutingCategory,
  readinessDetail,
  summarizeRouting,
} from '../src/tui/routing-data.js';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
function withCategoryField(
  source: ResolvedRoutingConfig,
  id: string,
  patch: (
    category: ResolvedRoutingConfig['categories'][number],
  ) => ResolvedRoutingConfig['categories'][number],
): ResolvedRoutingConfig {
  return {
    ...source,
    categories: source.categories.map((category) =>
      category.id === id ? patch(category) : category,
    ),
  };
}
describe('routing category pools', describeRoutingCategoryPools1);
describe('overview summary', describeOverviewSummary6);
describe('routing selection', describeRoutingSelection12);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function itListsAllTenAuthoritativeCategoriesInOrder2() {
  expect(ROUTING_CATEGORY_IDS).toEqual([
    'general',
    'coding',
    'reasoning',
    'planning',
    'debugging',
    'review',
    'testing',
    'quick',
    'documentation',
    'vision',
  ]);
  expect(buildCategoryPools(config).map((pool) => pool.id)).toEqual(ROUTING_CATEGORY_IDS);
}
function itResolvesConfiguredModelPoolsAndMarksMissing3() {
  const pools = buildCategoryPools(config);
  const general = pools.find((pool) => pool.id === 'general');
  const coding = pools.find((pool) => pool.id === 'coding');
  const reasoning = pools.find((pool) => pool.id === 'reasoning');
  expect(general).toMatchObject({
    configured: true,
    enabled: true,
    configuredModelCount: 2,
    enabledModelCount: 2,
    disabledModelCount: 0,
    unresolvedModelCount: 0,
  });
  expect(coding?.assignedModels.map((model) => model.id)).toEqual(['test/model-1']);
  expect(reasoning).toMatchObject({
    configured: false,
    enabled: false,
    configuredModelCount: 0,
    enabledModelCount: 0,
    unresolvedModelCount: 0,
  });
  expect(reasoning?.name).toBe('Complex Reasoning');
}
function itUsesGlobalDefaultsWhenOptionalCategorySettings4() {
  const withoutOptional = withCategoryField(config, 'general', (category) => ({
    id: category.id,
    name: category.name,
    modelIds: category.modelIds,
    enabled: true,
  }));
  const general = buildCategoryPools(withoutOptional).find((pool) => pool.id === 'general');
  expect(general?.description).toBe('Balanced routing for general tasks');
  expect(general?.strategy).toBe(config.defaultStrategy);
  expect(general?.strategyFromCategory).toBe(false);
  expect(general?.weightsFromCategory).toBe(false);
  expect(general?.effectiveWeights).toEqual(config.strategyWeights);
}
function itCountsUnresolvedCategoryReferencesWithoutInventingModels5() {
  const unresolved = withCategoryField(config, 'general', (category) => ({
    ...category,
    modelIds: [...category.modelIds, 'test/missing-model'],
  }));
  const general = buildCategoryPools(unresolved).find((pool) => pool.id === 'general');
  expect(general?.configuredModelCount).toBe(3);
  expect(general?.assignedModels).toHaveLength(2);
  expect(general?.unresolvedModelCount).toBe(1);
}
function describeRoutingCategoryPools1() {
  it(
    'lists all ten authoritative categories in order',
    itListsAllTenAuthoritativeCategoriesInOrder2,
  );
  it(
    'resolves configured model pools and marks missing categories clearly',
    itResolvesConfiguredModelPoolsAndMarksMissing3,
  );
  it(
    'uses global defaults when optional category settings are absent',
    itUsesGlobalDefaultsWhenOptionalCategorySettings4,
  );
  it(
    'counts unresolved category references without inventing models',
    itCountsUnresolvedCategoryReferencesWithoutInventingModels5,
  );
}
function itDerivesApprovedEnabledAndDisabledCountsFrom7() {
  const summary = summarizeRouting(config);
  expect(summary.approvedModelCount).toBe(2);
  expect(summary.enabledModelCount).toBe(2);
  expect(summary.disabledModelCount).toBe(0);
  expect(summary.configuredCategoryCount).toBe(2);
  expect(summary.enabledCategoryCount).toBe(2);
  expect(summary.categoriesWithEnabledModels).toBe(2);
  expect(summary.defaultCategoryName).toBe('General Purpose');
  expect(summary.freeOnly).toBe(false);
  expect(summary.cooldownEnabled).toBe(true);
  expect(summary.readiness).toBe('ready');
  expect(readinessDetail(summary.readiness)).toContain('enabled model');
}
function itHandlesAnEmptyGlobalAllowlistAsA8() {
  const empty = { ...config, models: [] };
  const summary = summarizeRouting(empty);
  expect(summary.approvedModelCount).toBe(0);
  expect(summary.enabledModelCount).toBe(0);
  expect(summary.readiness).toBe('no-models');
  expect(collectRoutingWarnings(empty)).toContain('The approved model allowlist is empty.');
}
function itDistinguishesDisabledModelsAndReportsNoEnabled9() {
  const disabled = {
    ...config,
    models: config.models.map((model) => ({ ...model, enabled: false })),
  };
  const summary = summarizeRouting(disabled);
  expect(summary.enabledModelCount).toBe(0);
  expect(summary.disabledModelCount).toBe(2);
  expect(summary.readiness).toBe('no-enabled-models');
  expect(collectRoutingWarnings(disabled)).toContain('No approved models are enabled.');
}
function itKeepsAbsentOptionalPolicyDataUndefined10() {
  const noCaps = { ...config, costPolicy: { freeOnly: true } };
  const summary = summarizeRouting(noCaps);
  expect(summary.freeOnly).toBe(true);
  expect(summary.maxCostPerRequest).toBeUndefined();
  expect(summary.maxCostPerSession).toBeUndefined();
  expect(summary.warnThreshold).toBeUndefined();
  expect(summary.budgetPeriodHours).toBeUndefined();
}
function itReportsMissingCategoriesAndUnresolvedFallbacksFrom11() {
  const fallbackConfig = {
    ...config,
    models: config.models.map((model) =>
      model.id === 'test/model-1' ? { ...model, fallbacks: ['test/missing-fallback'] } : model,
    ),
  };
  const warnings = collectRoutingWarnings(fallbackConfig);
  expect(warnings).toContain('8 predefined categories are not configured.');
  expect(warnings.some((warning) => warning.includes('fallback references'))).toBe(true);
}
function describeOverviewSummary6() {
  it(
    'derives approved, enabled and disabled counts from configuration',
    itDerivesApprovedEnabledAndDisabledCountsFrom7,
  );
  it(
    'handles an empty global allowlist as a valid configuration state',
    itHandlesAnEmptyGlobalAllowlistAsA8,
  );
  it(
    'distinguishes disabled models and reports no enabled candidates',
    itDistinguishesDisabledModelsAndReportsNoEnabled9,
  );
  it('keeps absent optional policy data undefined', itKeepsAbsentOptionalPolicyDataUndefined10);
  it(
    'reports missing categories and unresolved fallbacks from actual data',
    itReportsMissingCategoriesAndUnresolvedFallbacksFrom11,
  );
}
function itStartsOnTheConfiguredDefaultOrThe13() {
  expect(initialRoutingCategory(config)).toBe('general');
  expect(initialRoutingCategory({ ...config, defaultCategory: 'vision' })).toBe('vision');
  expect(initialRoutingCategory({ ...config, defaultCategory: 'unknown' })).toBe('general');
}
function describeRoutingSelection12() {
  it(
    'starts on the configured default or the first authoritative category',
    itStartsOnTheConfiguredDefaultOrThe13,
  );
}
