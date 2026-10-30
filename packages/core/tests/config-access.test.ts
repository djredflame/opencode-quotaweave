import { expect, it } from 'vitest';
import {
  ConfigValidationException,
  findAndLoadConfig,
  loadConfigFile,
} from '../src/routing/config-loader.js';
import type { ConfigFileAccess } from '../src/types.js';
import { GLOBAL_CONFIG_FIXTURE } from './config-fixtures.js';

function accessTo(files: Map<string, string>): ConfigFileAccess {
  return {
    readText(file) {
      const content = files.get(file);
      return content === undefined
        ? Promise.reject(new Error('Missing file'))
        : Promise.resolve(content);
    },
    exists: (file) => Promise.resolve(files.has(file)),
    join: (...parts) => parts.join('/'),
  };
}

it('loads global configuration through an injected adapter without a project override', async () => {
  const files = new Map([['project/router.json', JSON.stringify(GLOBAL_CONFIG_FIXTURE)]]);
  const config = await findAndLoadConfig('project', undefined, accessTo(files));
  expect(config.global).toEqual(GLOBAL_CONFIG_FIXTURE);
  expect(config.project).toBeUndefined();
});
it('does not silently ignore an invalid project override', async () => {
  const files = new Map([
    ['project/router.json', JSON.stringify(GLOBAL_CONFIG_FIXTURE)],
    ['project/router.project.json', '{"version":"invalid"}'],
  ]);
  await expect(findAndLoadConfig('project', undefined, accessTo(files))).rejects.toBeInstanceOf(
    ConfigValidationException,
  );
});
it('reports malformed JSON and missing configuration through the adapter', async () => {
  const access = accessTo(new Map([['malformed', '{']]));
  await expect(loadConfigFile('malformed', access)).rejects.toThrow('Failed to parse JSON');
  await expect(loadConfigFile('missing', access)).rejects.toThrow('Missing file');
});
it('propagates access failures rather than pretending that project configuration is absent', async () => {
  const access = accessTo(
    new Map([['project/router.json', JSON.stringify(GLOBAL_CONFIG_FIXTURE)]]),
  );
  access.exists = () => Promise.reject(new Error('Access denied'));
  await expect(findAndLoadConfig('project', undefined, access)).rejects.toThrow('Access denied');
});
