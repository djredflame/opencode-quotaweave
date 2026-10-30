/**
 * Regression guard for the OpenTUI Solid build transform.
 *
 * TypeScript alone emits static JSX props, which silently breaks tab and list
 * reactivity. The plugin build must post-process TSX with the official Solid
 * preset so signal reads become reactive getters.
 */
import { transformAsync } from '@babel/core';
import typescriptPreset from '@babel/preset-typescript';
import solidPreset from 'babel-preset-solid';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(testsDir, '..');
describe('Solid TSX build transform', describeSolidTSXBuildTransform0);
async function itEmitsReactiveGettersInsteadOfStaticJSX1() {
  const source = `
      const Child = (props: { value: string }) => <text>{props.value}</text>;
      export const Sample = (props: { value: string }) => (
        <Child value={props.value} />
      );
    `;
  const result = await transformAsync(source, {
    filename: 'sample.tsx',
    configFile: false,
    babelrc: false,
    presets: [
      [solidPreset, { moduleName: '@opentui/solid', generate: 'universal' }],
      [typescriptPreset],
    ],
  });
  expect(result?.code).toContain('get value()');
  expect(result?.code).toContain('@opentui/solid');
}
function itWiresTheTransformIntoThePackageBuild2() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  ) as {
    scripts?: Record<string, string>;
  };
  const buildScript = fs.readFileSync(path.join(packageRoot, 'scripts/build-solid.mjs'), 'utf8');
  expect(packageJson.scripts?.build).toContain('build-solid.mjs');
  expect(buildScript).toContain('babel-preset-solid');
  expect(buildScript).toContain("generate: 'universal'");
}
function describeSolidTSXBuildTransform0() {
  it(
    'emits reactive getters instead of static JSX props',
    itEmitsReactiveGettersInsteadOfStaticJSX1,
  );
  it(
    'wires the transform into the package build and deployment',
    itWiresTheTransformIntoThePackageBuild2,
  );
}
