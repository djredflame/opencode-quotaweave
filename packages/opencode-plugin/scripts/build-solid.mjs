/**
 * Post-build Solid transform for OpenTUI TSX sources.
 *
 * TypeScript emits JSX calls with static props, which breaks Solid signal
 * reactivity in tab, list, and result state. OpenTUI's host runtime expects the
 * official Solid transform, so every emitted TUI JSX module is rebuilt from
 * source with @opentui/solid's universal output.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import babel from '@babel/core';
import typescriptPreset from '@babel/preset-typescript';
import solidPreset from 'babel-preset-solid';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(packageRoot, 'src', 'tui');
const outputRoot = path.join(packageRoot, 'dist', 'tui');

async function collectTsx(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTsx(fullPath);
      return entry.name.endsWith('.tsx') ? [fullPath] : [];
    }),
  );
  return files.flat();
}

async function transformFile(sourcePath) {
  const relative = path.relative(sourceRoot, sourcePath);
  const outputPath = path.join(outputRoot, relative.replace(/\.tsx$/, '.js'));
  const source = await readFile(sourcePath, 'utf8');
  const result = await babel.transformAsync(source, {
    filename: sourcePath,
    configFile: false,
    babelrc: false,
    sourceMaps: true,
    sourceFileName: path.relative(path.dirname(outputPath), sourcePath),
    presets: [
      [solidPreset, { moduleName: '@opentui/solid', generate: 'universal' }],
      [typescriptPreset],
    ],
  });
  if (!result?.code) {
    throw new Error(`Solid transform produced no output for ${relative}`);
  }
  await writeFile(outputPath, `${result.code}\n`, 'utf8');
  if (result.map) {
    await writeFile(`${outputPath}.map`, `${JSON.stringify(result.map)}\n`, 'utf8');
  }
}

const files = await collectTsx(sourceRoot);
await Promise.all(files.map(transformFile));
