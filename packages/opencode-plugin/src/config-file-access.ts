/** Node filesystem adapter for the platform-independent core configuration loader. */
import type { ConfigFileAccess } from '@opencode-quotaweave/core';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

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
