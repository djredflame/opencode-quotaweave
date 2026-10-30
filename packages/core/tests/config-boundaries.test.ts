/** External configuration validation branches use malformed payloads, not unsafe type assertions. */
import { expect, it } from 'vitest';
import {
  validateGlobalConfig,
  validateProjectConfig,
  createDefaultProjectConfig,
  resolveConfig,
} from '../src/routing/config-loader.js';
import { GLOBAL_CONFIG_FIXTURE } from './config-fixtures.js';
import { requiredItem } from './required-item.js';

it.each([
  ['id', '', 'MISSING_MODEL_ID'],
  ['provider', '', 'MISSING_PROVIDER'],
  ['capabilities', [], 'MISSING_CAPABILITIES'],
  ['priority', -1, 'INVALID_PRIORITY'],
  ['costClassification', 'other', 'INVALID_COST_CLASSIFICATION'],
  ['enabled', 'yes', 'INVALID_ENABLED'],
  ['estimatedCostPer1kTokens', -1, 'INVALID_COST'],
  ['estimatedLatencyMs', -1, 'INVALID_LATENCY'],
  ['fallbacks', {}, 'INVALID_FALLBACKS'],
  ['fallbacks', [42], 'INVALID_FALLBACK_ID'],
])('rejects malformed model field %s', (field, value, code) => {
  const model = { ...requiredItem(GLOBAL_CONFIG_FIXTURE.models, 0), [String(field)]: value };
  const result = validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, models: [model] });
  expect(result.valid).toBe(false);
  expect(result.errors.some((error) => error.code === code)).toBe(true);
});
it.each([
  ['id', '', 'MISSING_CATEGORY_ID'],
  ['id', 'invented', 'INVALID_CATEGORY_ID'],
  ['name', '', 'MISSING_CATEGORY_NAME'],
  ['modelIds', [], 'EMPTY_CATEGORY_MODELS'],
  ['modelIds', [42], 'INVALID_MODEL_ID'],
  ['enabled', 42, 'INVALID_CATEGORY_ENABLED'],
  ['defaultStrategy', 'invented', 'INVALID_CATEGORY_STRATEGY'],
  ['strategyWeights', null, 'INVALID_STRATEGY_WEIGHTS'],
])('rejects malformed category field %s', (field, value, code) => {
  const category = { ...requiredItem(GLOBAL_CONFIG_FIXTURE.categories, 0), [String(field)]: value };
  const result = validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, categories: [category] });
  expect(result.valid).toBe(false);
  expect(result.errors.some((error) => error.code === code)).toBe(true);
});
it.each([
  ['models', null],
  ['models', true],
  ['categories', null],
  ['defaultCategory', ''],
  ['defaultStrategy', 'invented'],
  ['strategyWeights', null],
  ['costPolicy', true],
  ['cooldownConfig', true],
  ['shadowMode', true],
  ['multiAgent', true],
])('rejects invalid global configuration field %s', (field, value) => {
  expect(validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, [field]: value }).valid).toBe(false);
});
it.each([
  ['freeOnly', 'yes'],
  ['maxCostPerRequest', -1],
  ['maxCostPerSession', -1],
  ['warnThreshold', 2],
  ['budgetPeriodHours', 0],
])('rejects invalid cost policy field %s', (field, value) => {
  expect(
    validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, costPolicy: { [field]: value } }).valid,
  ).toBe(false);
});
it.each([
  ['enabled', 'yes'],
  ['defaultCooldownMs', -1],
  ['maxCooldownMs', -1],
  ['backoffMultiplier', 0],
  ['resetOnSuccess', 'yes'],
])('rejects invalid cooldown field %s', (field, value) => {
  expect(
    validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, cooldownConfig: { [field]: value } }).valid,
  ).toBe(false);
});
it.each([
  ['enabled', 'yes'],
  ['shadowModelIds', 'model'],
  ['logDecisions', 42],
  ['sampleRate', 2],
])('rejects invalid shadow mode field %s', (field, value) => {
  expect(
    validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, shadowMode: { [field]: value } }).valid,
  ).toBe(false);
});
it.each([
  'requirePreview',
  'stopOnModelFailure',
  'noParallelFsWrites',
  'enforceAllowlists',
  'previewNoQuotaConsumption',
  'enforceGuards',
  'mode',
])('rejects invalid multi-agent field %s', (field) => {
  expect(
    validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, multiAgent: { [field]: 'invalid' } }).valid,
  ).toBe(false);
});
it('handles nonobject models/categories and duplicate category identities', () => {
  expect(validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, models: [null] }).valid).toBe(false);
  expect(validateGlobalConfig({ ...GLOBAL_CONFIG_FIXTURE, categories: [null] }).valid).toBe(false);
  const category = requiredItem(GLOBAL_CONFIG_FIXTURE.categories, 0);
  expect(
    validateGlobalConfig({
      ...GLOBAL_CONFIG_FIXTURE,
      categories: [category, category],
    }).errors.some((error) => error.code === 'DUPLICATE_CATEGORY_ID'),
  ).toBe(true);
  expect(validateGlobalConfig(null).valid).toBe(false);
});
it.each([
  null,
  { projectId: '' },
  { globalConfigVersion: '' },
  { models: [null] },
  { categories: [null] },
  { defaultCategory: '' },
  { defaultStrategy: 'invented' },
  { strategyWeights: null },
  { costPolicy: true },
  { cooldownConfig: true },
  { shadowMode: true },
])('validates project override boundaries %j', (patch) => {
  const project = createDefaultProjectConfig('project', GLOBAL_CONFIG_FIXTURE.version);
  const input = patch === null ? null : { ...project, ...patch };
  expect(validateProjectConfig(input, GLOBAL_CONFIG_FIXTURE).valid).toBe(false);
});
it('preserves defaults with warnings and merges validated optional overrides', () => {
  const withoutPolicies = {
    ...GLOBAL_CONFIG_FIXTURE,
    costPolicy: undefined,
    cooldownConfig: undefined,
    shadowMode: undefined,
  };
  expect(validateGlobalConfig(withoutPolicies).warnings.map((warning) => warning.code)).toEqual(
    expect.arrayContaining([
      'MISSING_COST_POLICY',
      'MISSING_COOLDOWN_CONFIG',
      'MISSING_SHADOW_MODE',
    ]),
  );
  const project = {
    ...createDefaultProjectConfig('project', GLOBAL_CONFIG_FIXTURE.version),
    defaultStrategy: 'cost-optimize' as const,
    strategyWeights: { 'cost-optimize': 1 },
    costPolicy: { freeOnly: true },
    cooldownConfig: { enabled: false },
    shadowMode: { enabled: true },
  };
  expect(resolveConfig(GLOBAL_CONFIG_FIXTURE, project)).toMatchObject({
    defaultStrategy: 'cost-optimize',
    costPolicy: { freeOnly: true },
    cooldownConfig: { enabled: false },
    shadowMode: { enabled: true },
  });
});
