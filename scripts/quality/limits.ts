/** One structural policy shared by ESLint, targeted checks and test guardrails. */
import type { Linter } from 'eslint';
export const limits = Object.freeze({
  file: 300,
  function: 50,
  parameters: 4,
  depth: 3,
  review: 250,
});
export const structuralRules: Record<string, Linter.RuleEntry> = {
  'max-lines': ['error', { max: limits.file, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': [
    'error',
    { max: limits.function, skipBlankLines: true, skipComments: true, IIFEs: true },
  ],
  'max-params': ['error', { max: limits.parameters }],
  'max-depth': ['error', { max: limits.depth }],
};
