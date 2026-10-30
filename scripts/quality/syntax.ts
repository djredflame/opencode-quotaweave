/** Structural rules also cover authored code intentionally outside type-aware project programs. */
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { structuralRules } from './limits.ts';

export function syntaxCheck(source: string, filename: string): Linter.LintMessage[] {
  return new Linter().verify(
    source,
    [
      {
        files: ['**/*.{ts,tsx,js,mjs}'],
        languageOptions: { parser: tseslint.parser },
        plugins: { '@typescript-eslint': tseslint.plugin },
        rules: {
          ...structuralRules,
          '@typescript-eslint/no-explicit-any': 'error',
          'no-console': ['error', { allow: ['error', 'warn'] }],
        },
      },
    ],
    { filename },
  );
}
