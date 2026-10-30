/** Explicit test-only filesystem adapter; production core code stays platform-independent. */
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { ConfigFileAccess } from '../src/types.js';
export const configFileAccess: ConfigFileAccess = {
  readText: (filePath) => readFile(filePath, 'utf8'),
  async exists(filePath) {
    try {
      await stat(filePath);
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
      throw error;
    }
  },
  join,
};
