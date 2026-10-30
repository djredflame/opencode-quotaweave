import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import babel from '@babel/core';
import typescriptPreset from '@babel/preset-typescript';
import solidPreset from 'babel-preset-solid';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const solidClient = require.resolve('solid-js/dist/solid.js');

/**
 * OpenTUI components rely on the official Solid JSX transform. Apply the same
 * transform used by the package build so component tests exercise reactive
 * signal reads instead of static JSX snapshots.
 */
function solidTsxPlugin(): Plugin {
  return {
    name: 'quotaweave-solid-tsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.tsx')) return null;
      const result = await babel.transformAsync(code, {
        filename: id,
        configFile: false,
        babelrc: false,
        sourceMaps: true,
        presets: [
          [solidPreset, { moduleName: '@opentui/solid', generate: 'universal' }],
          [typescriptPreset],
        ],
      });
      if (!result?.code) return null;
      return { code: result.code, map: result.map ?? null };
    },
  };
}

export default defineConfig({
  plugins: [solidTsxPlugin()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.d.ts', '**/*.config.*'],
    },
    globals: true,
  },
  resolve: {
    alias: [
      { find: /^solid-js$/, replacement: solidClient },
      { find: '@opencode-quotaweave/core', replacement: path.resolve(__dirname, '../core/src') },
    ],
  },
});
