/**
 * Configuration loader and validator for QuotaWeave routing configuration
 *
 * Handles loading, validation, and merging of global and project-specific configurations.
 */
import { isValidStrategy } from './config-is-valid-strategy.js';
import { validateStrategyWeights } from './config-validate-strategy-weights.js';
import {
  PREDEFINED_CATEGORIES,
  type ConfigValidationError,
  type ConfigValidationWarning,
  type RoutingCategoryId,
} from './config.js';
export function validateCategories({
  categories,
  globalModels,
  errors,
  warnings,
  pathPrefix = 'categories',
}: ValidateCategoriesArgs): void {
  const seenIds = new Set<string>();
  const globalModelIds = new Set(
    globalModels.flatMap((model) =>
      model && typeof model === 'object' && 'id' in model && typeof model.id === 'string'
        ? [model.id]
        : [],
    ),
  );
  const validCategoryIds = new Set(Object.keys(PREDEFINED_CATEGORIES) as RoutingCategoryId[]);
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const catPath = `${pathPrefix}[${i}]`;
    if (!cat || typeof cat !== 'object') {
      errors.push({
        code: 'INVALID_CATEGORY',
        message: 'Category must be an object',
        path: catPath,
        value: cat,
      });
      continue;
    }
    const c = cat as Record<string, unknown>;
    validateCategoryIdentity({
      c: c,
      errors: errors,
      catPath: catPath,
      validCategoryIds: validCategoryIds,
      seenIds: seenIds,
    });
    validateCategoryModels({
      c: c,
      errors: errors,
      catPath: catPath,
      globalModelIds: globalModelIds,
      warnings: warnings,
    });
    validateCategoryPolicy(c, errors, catPath);
  }
}
function validateCategoryIdentity({
  c,
  errors,
  catPath,
  validCategoryIds,
  seenIds,
}: ValidateCategoryIdentityArgs) {
  if (typeof c.id !== 'string' || !c.id) {
    errors.push({
      code: 'MISSING_CATEGORY_ID',
      message: 'Category id is required',
      path: `${catPath}.id`,
      value: c.id,
    });
  } else if (!validCategoryIds.has(c.id as RoutingCategoryId)) {
    errors.push({
      code: 'INVALID_CATEGORY_ID',
      message: `Category id "${c.id}" is not a predefined category. Valid categories: ${Array.from(validCategoryIds).join(', ')}`,
      path: `${catPath}.id`,
      value: c.id,
    });
  } else if (seenIds.has(c.id)) {
    errors.push({
      code: 'DUPLICATE_CATEGORY_ID',
      message: `Duplicate category id: ${c.id}`,
      path: `${catPath}.id`,
      value: c.id,
    });
  } else {
    seenIds.add(c.id);
  }
  if (typeof c.name !== 'string' || !c.name) {
    errors.push({
      code: 'MISSING_CATEGORY_NAME',
      message: 'Category name is required',
      path: `${catPath}.name`,
      value: c.name,
    });
  }
}
function validateCategoryModels({
  c,
  errors,
  catPath,
  globalModelIds,
  warnings,
}: ValidateCategoryModelsArgs) {
  if (!Array.isArray(c.modelIds) || c.modelIds.length === 0) {
    errors.push({
      code: 'EMPTY_CATEGORY_MODELS',
      message: 'Category must have at least one modelId',
      path: `${catPath}.modelIds`,
      value: c.modelIds,
    });
  } else {
    for (let j = 0; j < c.modelIds.length; j++) {
      const mid: unknown = c.modelIds[j];
      if (typeof mid !== 'string') {
        errors.push({
          code: 'INVALID_MODEL_ID',
          message: 'modelIds must be strings',
          path: `${catPath}.modelIds[${j}]`,
          value: mid,
        });
      } else if (!globalModelIds.has(mid)) {
        warnings.push({
          code: 'MODEL_NOT_IN_GLOBAL',
          message: `Category references model ${mid} which is not in global allowlist`,
          path: `${catPath}.modelIds[${j}]`,
        });
      }
    }
  }
}
function validateCategoryPolicy(
  c: Record<string, unknown>,
  errors: ConfigValidationError[],
  catPath: string,
) {
  if (c.defaultStrategy !== undefined && !isValidStrategy(c.defaultStrategy)) {
    errors.push({
      code: 'INVALID_CATEGORY_STRATEGY',
      message: 'defaultStrategy must be a valid strategy type',
      path: `${catPath}.defaultStrategy`,
      value: c.defaultStrategy,
    });
  }
  if (c.strategyWeights !== undefined) {
    validateStrategyWeights(c.strategyWeights, errors, `${catPath}.strategyWeights`);
  }
  if (typeof c.enabled !== 'boolean') {
    errors.push({
      code: 'INVALID_CATEGORY_ENABLED',
      message: 'enabled must be a boolean',
      path: `${catPath}.enabled`,
      value: c.enabled,
    });
  }
}
type ValidateCategoriesArgs = {
  categories: unknown[];
  globalModels: unknown[];
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
  pathPrefix?: string | undefined;
};
type ValidateCategoryIdentityArgs = {
  c: Record<string, unknown>;
  errors: ConfigValidationError[];
  catPath: string;
  validCategoryIds: Set<RoutingCategoryId>;
  seenIds: Set<string>;
};
type ValidateCategoryModelsArgs = {
  c: Record<string, unknown>;
  errors: ConfigValidationError[];
  catPath: string;
  globalModelIds: Set<string>;
  warnings: ConfigValidationWarning[];
};
