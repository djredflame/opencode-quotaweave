import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Layout regression tests for model rows.
 *
 * The row keeps the model ID, cost badge and enabled state in separate flex
 * regions. The identity region owns truncation; the status region must never
 * shrink, so labels cannot overlap the identifier on narrow lists.
 */
import {
  findAndLoadConfig,
  resolveConfig,
  type ModelConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'solid-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
let config: ResolvedRoutingConfig;
let longModel: ModelConfig;
beforeAll(beforeAllBeforeAll0);
vi.mock('@opencode/plugin/tui', () => {
  const color = '#ffffff';
  const theme = {
    text: {
      base: color,
      muted: color,
      faint: color,
      action: { primary: { base: color, focused: color, hovered: color } },
      feedback: {
        error: { base: color, muted: color },
        info: { base: color },
        success: { base: color },
        warning: { base: color },
      },
      formfield: { base: color, focused: color },
    },
    background: {
      action: {
        primary: { focused: color, hovered: color, selected: color },
        secondary: { hovered: color },
      },
      formfield: { base: color, focused: color },
      raised: { base: color, high: color },
    },
    scrollbar: { base: color },
  };
  return {
    usePlugin: () => ({
      theme,
      keymap: { layer: () => undefined },
      ui: { dialog: { clear: () => undefined } },
    }),
  };
});
interface VirtualNode {
  readonly tag: string;
  readonly props: Record<string, unknown>;
  readonly children: unknown[];
}
vi.mock('@opentui/solid', async () => {
  const { createMemo, createRenderEffect } = await import('solid-js');
  const unwrap = (value: unknown): unknown => {
    if (isCallable(value)) return unwrap(value());
    if (Array.isArray(value)) return value.map(unwrap);
    return value;
  };
  return {
    createElement: (tag: string): VirtualNode => ({ tag, props: {}, children: [] }),
    createTextNode: (text: string) => ({ text }),
    setProp: (element: VirtualNode, key: string, value: unknown) => {
      element.props[key] = value;
      if (key === 'ref' && isCallable(value)) value(element);
      return value;
    },
    insertNode: (parent: VirtualNode, child: unknown) => {
      parent.children.push(unwrap(child));
    },
    insert: (parent: VirtualNode, child: unknown) => {
      if (isCallable(child)) {
        const slot = { props: {}, children: [] as unknown[] };
        parent.children.push(slot);
        createRenderEffect(() => {
          slot.children = [unwrap(child())];
        });
        return slot;
      }
      parent.children.push(unwrap(child));
      return child;
    },
    createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
    effect: (effect: (previous?: unknown) => unknown, value?: unknown) =>
      createRenderEffect(effect, value),
    memo: (fn: () => unknown, value?: unknown) => createMemo(fn, value),
    use: (handler: (value: unknown) => void, value: unknown) => handler(value),
  };
});
const { ModelList } = await import('../src/tui/components/ModelList.js');
function findNode(
  node: unknown,
  predicate: (node: VirtualNode) => boolean,
): VirtualNode | undefined {
  if (node === null || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  const record = node as Partial<VirtualNode>;
  if (record.tag && record.props && predicate(record as VirtualNode)) return record as VirtualNode;
  return record.children ? findNode(record.children, predicate) : undefined;
}
function resolveTree(value: unknown): unknown {
  if (isCallable(value)) return resolveTree(value());
  if (Array.isArray(value)) return value.map(resolveTree);
  return value;
}
function mountList() {
  return createRoot((dispose) => {
    const tree = resolveTree(
      ModelList({
        config,
        models: [longModel],
        selectedId: null,
        initialScrollTop: 0,
        onSelect: () => undefined,
        onScrollPositionChange: () => undefined,
      }),
    );
    return { tree, dispose };
  });
}
function textContent(node: unknown): string {
  if (typeof node === 'string') return node;
  if (node === null || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(textContent).join('');
  const record = node as {
    text?: string;
    children?: unknown[];
  };
  if (record.text) return record.text;
  return record.children ? textContent(record.children) : '';
}
describe('model row layout', describeModelRowLayout1);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
  const base = config.models[0];
  if (!base) throw new Error('Test configuration has no models');
  longModel = {
    ...base,
    id: 'provider/very-long-model-identifier-that-must-truncate-gracefully',
  };
}
function itKeepsIdentifierCostBadgeAndEnabledState2() {
  const { tree, dispose } = mountList();
  const row = findNode(
    tree,
    (node) =>
      typeof node.props.id === 'string' && node.props.id.startsWith('quotaweave-model-row-'),
  );
  expect(row).toBeDefined();
  const [titleRow, metadata] = row?.children as VirtualNode[];
  expect(titleRow?.tag).toBe('box');
  expect(metadata?.tag).toBe('text');
  expect(metadata?.props).toMatchObject({ truncate: true, wrapMode: 'none' });
  const regions = titleRow?.children as VirtualNode[];
  expect(regions).toHaveLength(3);
  const identity = regions[1];
  const status = regions[2];
  expect(identity?.props).toMatchObject({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: 'hidden',
  });
  expect(status?.props).toMatchObject({ flexShrink: 0 });
  const identityText = identity?.children[0] as VirtualNode;
  expect(identityText?.props).toMatchObject({
    width: '100%',
    truncate: true,
    wrapMode: 'none',
  });
  expect(textContent(identityText)).toContain(longModel.id);
  dispose();
}
function describeModelRowLayout1() {
  it(
    'keeps identifier, cost badge and enabled state in separate regions',
    itKeepsIdentifierCostBadgeAndEnabledState2,
  );
}
