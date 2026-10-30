import { GLOBAL_CONFIG_FIXTURE } from './config-fixtures.js';
import { requiredItem } from './required-item.js';
/**
 * Tests for routing configuration types and validation
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONFIG_SCHEMA_VERSION,
  createDefaultGlobalConfig,
  createDefaultProjectConfig,
  resolveConfig,
  validateGlobalConfig,
  validateProjectConfig,
} from '../src/routing/config-loader.js';
import type { GlobalRoutingConfig, ProjectRoutingConfig } from '../src/routing/config.js';
let validGlobalConfig: GlobalRoutingConfig;
let validProjectConfig: ProjectRoutingConfig;
describe('Config Validation', describeConfigValidation0);
function beforeEachBeforeEach1() {
  validGlobalConfig = structuredClone(GLOBAL_CONFIG_FIXTURE);
}
function itShouldValidateACorrectGlobalConfig3() {
  const result = validateGlobalConfig(validGlobalConfig);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
}
function itShouldRejectConfigWithWrongVersion4() {
  const config = { ...validGlobalConfig, version: '0.9.0' };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'VERSION_MISMATCH')).toBe(true);
}
function itShouldRejectConfigWithMissingModels5() {
  const { models, ...configWithoutModels } = validGlobalConfig;
  void models;
  const result = validateGlobalConfig(configWithoutModels);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'MISSING_MODELS')).toBe(true);
}
function itShouldRejectConfigWithMissingCategories6() {
  const { categories, ...configWithoutCategories } = validGlobalConfig;
  void categories;
  const result = validateGlobalConfig(configWithoutCategories);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'MISSING_CATEGORIES')).toBe(true);
}
function itShouldRejectDuplicateModelIDs7() {
  const config = {
    ...validGlobalConfig,
    models: [
      requiredItem(validGlobalConfig.models, 0),
      { ...requiredItem(validGlobalConfig.models, 0), id: 'test/model-1' },
    ],
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'DUPLICATE_MODEL_ID')).toBe(true);
}
function itShouldRejectInvalidCostClassification8() {
  const config = {
    ...validGlobalConfig,
    models: [{ ...requiredItem(validGlobalConfig.models, 0), costClassification: 'invalid' }],
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'INVALID_COST_CLASSIFICATION')).toBe(true);
}
function itShouldRejectInvalidPriority9() {
  const config = {
    ...validGlobalConfig,
    models: [{ ...requiredItem(validGlobalConfig.models, 0), priority: 150 }],
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'INVALID_PRIORITY')).toBe(true);
}
function itShouldRejectEmptyCategoryModelIds10() {
  const config = {
    ...validGlobalConfig,
    categories: [{ ...requiredItem(validGlobalConfig.categories, 0), modelIds: [] }],
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'EMPTY_CATEGORY_MODELS')).toBe(true);
}
function itShouldRejectInvalidStrategyWeights11() {
  const config = {
    ...validGlobalConfig,
    strategyWeights: {
      ...validGlobalConfig.strategyWeights,
      'capability-match': 1.5,
    },
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'INVALID_STRATEGY_WEIGHT')).toBe(true);
}
function itShouldRejectFreeOnlyAsNonBoolean12() {
  const config = {
    ...validGlobalConfig,
    costPolicy: { ...validGlobalConfig.costPolicy, freeOnly: 'yes' },
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'INVALID_FREE_ONLY')).toBe(true);
}
function itShouldWarnAboutModelNotInGlobal13() {
  const config = {
    ...validGlobalConfig,
    categories: [
      {
        ...requiredItem(validGlobalConfig.categories, 0),
        modelIds: ['test/model-1', 'test/nonexistent'],
      },
    ],
  };
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(true);
  expect(result.warnings.some((w) => w.code === 'MODEL_NOT_IN_GLOBAL')).toBe(true);
}
function describeValidateGlobalConfig2() {
  it('should validate a correct global config', itShouldValidateACorrectGlobalConfig3);
  it('should reject config with wrong version', itShouldRejectConfigWithWrongVersion4);
  it('should reject config with missing models', itShouldRejectConfigWithMissingModels5);
  it('should reject config with missing categories', itShouldRejectConfigWithMissingCategories6);
  it('should reject duplicate model IDs', itShouldRejectDuplicateModelIDs7);
  it('should reject invalid cost classification', itShouldRejectInvalidCostClassification8);
  it('should reject invalid priority', itShouldRejectInvalidPriority9);
  it('should reject empty category modelIds', itShouldRejectEmptyCategoryModelIds10);
  it('should reject invalid strategy weights', itShouldRejectInvalidStrategyWeights11);
  it('should reject freeOnly as non-boolean', itShouldRejectFreeOnlyAsNonBoolean12);
  it('should warn about model not in global allowlist', itShouldWarnAboutModelNotInGlobal13);
}
function beforeEachBeforeEach15() {
  validProjectConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    models: [requiredItem(validGlobalConfig.models, 0)],
    categories: [requiredItem(validGlobalConfig.categories, 0)],
    metadata: {},
  };
}
function itShouldValidateACorrectProjectConfig16() {
  const result = validateProjectConfig(validProjectConfig, validGlobalConfig);
  expect(result.valid).toBe(true);
}
function itShouldRejectProjectConfigWithModelNot17() {
  const config = {
    ...validProjectConfig,
    models: [{ ...requiredItem(validGlobalConfig.models, 0), id: 'test/nonexistent' }],
  };
  const result = validateProjectConfig(config, validGlobalConfig);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'MODEL_NOT_IN_GLOBAL')).toBe(true);
}
function itShouldRejectProjectConfigWithCategoryNot18() {
  const config = {
    ...validProjectConfig,
    categories: [{ ...requiredItem(validGlobalConfig.categories, 0), id: 'nonexistent' }],
  };
  const result = validateProjectConfig(config, validGlobalConfig);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.code === 'CATEGORY_NOT_IN_GLOBAL')).toBe(true);
}
function itShouldWarnAboutGlobalVersionMismatch19() {
  const config = {
    ...validProjectConfig,
    globalConfigVersion: '0.9.0',
  };
  const result = validateProjectConfig(config, validGlobalConfig);
  expect(result.valid).toBe(true);
  expect(result.warnings.some((w) => w.code === 'GLOBAL_VERSION_MISMATCH')).toBe(true);
}
function describeValidateProjectConfig14() {
  beforeEach(beforeEachBeforeEach15);
  it('should validate a correct project config', itShouldValidateACorrectProjectConfig16);
  it(
    'should reject project config with model not in global',
    itShouldRejectProjectConfigWithModelNot17,
  );
  it(
    'should reject project config with category not in global',
    itShouldRejectProjectConfigWithCategoryNot18,
  );
  it('should warn about global version mismatch', itShouldWarnAboutGlobalVersionMismatch19);
}
function itShouldReturnGlobalConfigWhenNoProject21() {
  const resolved = resolveConfig(validGlobalConfig);
  expect(resolved.models).toHaveLength(2);
  expect(resolved.categories).toHaveLength(2);
  expect(resolved.defaultCategory).toBe('general');
}
function itShouldRestrictModelsToProjectConfig22() {
  const projectConfig: ProjectRoutingConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    models: [requiredItem(validGlobalConfig.models, 0)], // Only model-1
    metadata: {},
  };
  const resolved = resolveConfig(validGlobalConfig, projectConfig);
  expect(resolved.models).toHaveLength(1);
  expect(requiredItem(resolved.models, 0).id).toBe('test/model-1');
}
function itShouldRestrictCategoriesToProjectConfig23() {
  const projectConfig: ProjectRoutingConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    categories: [requiredItem(validGlobalConfig.categories, 1)], // Only coding
    metadata: {},
  };
  const resolved = resolveConfig(validGlobalConfig, projectConfig);
  expect(resolved.categories).toHaveLength(1);
  expect(requiredItem(resolved.categories, 0).id).toBe('coding');
}
function itShouldFilterCategoryModelIdsToOnlyInclude24() {
  const projectConfig: ProjectRoutingConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    models: [requiredItem(validGlobalConfig.models, 0)], // Only model-1
    categories: [requiredItem(validGlobalConfig.categories, 0)], // general has model-1 and model-2
    metadata: {},
  };
  const resolved = resolveConfig(validGlobalConfig, projectConfig);
  expect(requiredItem(resolved.categories, 0).modelIds).toEqual(['test/model-1']);
}
function itShouldOverrideDefaultCategory25() {
  const projectConfig: ProjectRoutingConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    defaultCategory: 'coding',
    metadata: {},
  };
  const resolved = resolveConfig(validGlobalConfig, projectConfig);
  expect(resolved.defaultCategory).toBe('coding');
}
function itShouldMergeStrategyWeights26() {
  const projectConfig: ProjectRoutingConfig = {
    version: CONFIG_SCHEMA_VERSION,
    projectId: 'test-project',
    globalConfigVersion: CONFIG_SCHEMA_VERSION,
    strategyWeights: {
      'cost-optimize': 0.5,
    },
    metadata: {},
  };
  const resolved = resolveConfig(validGlobalConfig, projectConfig);
  expect(resolved.strategyWeights['cost-optimize']).toBe(0.5);
  expect(resolved.strategyWeights['capability-match']).toBe(0.5); // unchanged
}
function describeResolveConfig20() {
  it(
    'should return global config when no project config',
    itShouldReturnGlobalConfigWhenNoProject21,
  );
  it('should restrict models to project config', itShouldRestrictModelsToProjectConfig22);
  it('should restrict categories to project config', itShouldRestrictCategoriesToProjectConfig23);
  it(
    'should filter category modelIds to only include resolved models',
    itShouldFilterCategoryModelIdsToOnlyInclude24,
  );
  it('should override defaultCategory', itShouldOverrideDefaultCategory25);
  it('should merge strategy weights', itShouldMergeStrategyWeights26);
}
function itShouldCreateAValidDefaultConfig28() {
  const config = createDefaultGlobalConfig();
  const result = validateGlobalConfig(config);
  expect(result.valid).toBe(true);
  expect(config.version).toBe(CONFIG_SCHEMA_VERSION);
  expect(config.models).toEqual([]);
  expect(config.categories).toEqual([]);
}
function describeCreateDefaultGlobalConfig27() {
  it('should create a valid default config', itShouldCreateAValidDefaultConfig28);
}
function itShouldCreateAValidDefaultProjectConfig30() {
  const config = createDefaultProjectConfig('test-project', CONFIG_SCHEMA_VERSION);
  expect(config.projectId).toBe('test-project');
  expect(config.globalConfigVersion).toBe(CONFIG_SCHEMA_VERSION);
  expect(config.version).toBe(CONFIG_SCHEMA_VERSION);
}
function describeCreateDefaultProjectConfig29() {
  it('should create a valid default project config', itShouldCreateAValidDefaultProjectConfig30);
}
function describeConfigValidation0() {
  beforeEach(beforeEachBeforeEach1);
  describe('validateGlobalConfig', describeValidateGlobalConfig2);
  describe('validateProjectConfig', describeValidateProjectConfig14);
  describe('resolveConfig', describeResolveConfig20);
  describe('createDefaultGlobalConfig', describeCreateDefaultGlobalConfig27);
  describe('createDefaultProjectConfig', describeCreateDefaultProjectConfig29);
}
