import { structuralRules } from './scripts/quality/limits.ts';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      'build/**',
      '**/coverage/**',
      'scripts/agents/.fixtures/**',
      '.serena/**',
      '.opencode/plugins/**',
      '**/*.test.js',
      '**/*.test.js.map',
      '**/*.test.d.ts',
      '**/*.test.d.ts.map',
      '**/vitest.config.ts',
      '**/vitest.config.mts',
      'eslint.config.mjs',
      'packages/opencode-plugin/server.js',
      'packages/opencode-plugin/tui.js',
      'packages/opencode-plugin/scripts/**',
      'packages/opencode-plugin/tests/tui-route-registration.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...structuralRules,
      'no-console': ['error', { allow: ['error', 'warn'] }],
      // TypeScript strictness
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
    },
  },
  prettier,
);
