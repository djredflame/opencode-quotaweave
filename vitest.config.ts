/** Run package projects with their native transforms; infrastructure uses node:test separately. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { projects: ['packages/*/vitest.config.ts'] } });
