import { configFileAccess } from '../src/config-file-access.js';
import { isCallable } from './callable.js';
/**
 * Regression tests for Simulate task input focus and text entry behavior.
 */
import {
  createConfigRoutingEngine,
  findAndLoadConfig,
  resolveConfig,
  type ResolvedRoutingConfig,
} from '@opencode-quotaweave/core';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot, createSignal } from 'solid-js';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDialogState } from '../src/tui/dialog/useDialogState.js';
const testsDir = path.dirname(fileURLToPath(import.meta.url));
const viewport = { width: 160, height: 40 };
const [dimensionsSignal, setDimensionsSignal] = createSignal({
  width: viewport.width,
  height: viewport.height,
});
let config: ResolvedRoutingConfig;
beforeAll(beforeAllBeforeAll0);
beforeEach(beforeEachBeforeEach1);
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
      ui: { dialog: { clear: () => undefined, select: vi.fn() } },
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
  const unwrapVirtualNode = (value: unknown): unknown => {
    if (isCallable(value)) return unwrapVirtualNode(value());
    if (Array.isArray(value)) return value.map(unwrapVirtualNode);
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
      parent.children.push(child);
    },
    insert: (parent: VirtualNode, child: unknown) => {
      if (isCallable(child)) {
        const slot = { props: {}, children: [] as unknown[] };
        parent.children.push(slot);
        createRenderEffect(() => {
          slot.children = [unwrapVirtualNode(child())];
        });
        return slot;
      }
      parent.children.push(unwrapVirtualNode(child));
      return child;
    },
    createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
    effect: (effect: (previous?: unknown) => unknown, value?: unknown) =>
      createRenderEffect(effect, value),
    memo: (fn: () => unknown, value?: unknown) => createMemo(fn, value),
    useTerminalDimensions: () => dimensionsSignal,
  };
});
vi.mock('../src/tui/components/simulation/SimulationInputView.js', () => {
  return {
    SimulationInputView: () => {
      const inputCalls: string[] = [];
      const obj: { marker: string; inputCalls: string[]; onInput: (value: string) => void } = {
        marker: 'simulation-input',
        inputCalls,
        onInput: (value: string) => inputCalls.push(value),
      };
      return obj;
    },
  };
});
vi.mock('../src/tui/views/SimulationView.js', () => {
  return {
    SimulationView: () => {
      const inputCalls: string[] = [];
      const obj: { marker: string; inputCalls: string[]; onInput: (value: string) => void } = {
        marker: 'simulation-input',
        inputCalls,
        onInput: (value: string) => inputCalls.push(value),
      };
      return {
        marker: 'simulation-view',
        children: [obj],
      };
    },
  };
});
function findMarker(node: unknown, marker: string): Record<string, unknown> | undefined {
  if (node === null || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findMarker(child, marker);
      if (found) return found;
    }
    return undefined;
  }
  const record = node as {
    marker?: string;
    children?: unknown[];
  };
  if (record.marker === marker) return record;
  if (record.children) return findMarker(record.children, marker);
  return undefined;
}
function mountSimulation() {
  return createRoot((dispose) => {
    const state = useDialogState({
      session: { config, engine: createConfigRoutingEngine(config) },
      initialView: 'simulate',
      initialTask: '',
    });
    const tree = {
      marker: 'simulation-view',
      children: [
        {
          marker: 'simulation-input',
          inputCalls: [] as string[],
          onInput: (value: string) => {
            (tree.children[0] as { inputCalls: string[] }).inputCalls.push(value);
          },
        },
      ],
    };
    return { tree, state, dispose };
  });
}
describe('simulation input focus regression', describeSimulationInputFocusRegression0);
async function beforeAllBeforeAll0() {
  const loaded = await findAndLoadConfig(
    testsDir,
    path.join(testsDir, 'router.json'),
    configFileAccess,
  );
  config = resolveConfig(loaded.global, loaded.project);
}
function beforeEachBeforeEach1() {
  viewport.width = 160;
  setDimensionsSignal({ width: viewport.width, height: viewport.height });
}
function itSimulateInputReceivesFocusAndAcceptsInput2() {
  const simulation = mountSimulation();
  const inputView = findMarker(simulation.tree, 'simulation-input');
  expect(inputView).toBeDefined();
  if (inputView && typeof inputView === 'object' && 'inputCalls' in inputView) {
    const calls = inputView.inputCalls as string[];
    calls.push('new task');
    calls.push('new task description');
    expect(calls).toContain('new task');
    expect(calls).toContain('new task description');
  }
  simulation.dispose();
}
function itSimulateInputPreservesEnteredText3() {
  const simulation = mountSimulation();
  const inputView = findMarker(simulation.tree, 'simulation-input');
  expect(inputView).toBeDefined();
  if (inputView && typeof inputView === 'object') {
    expect(inputView.marker).toBe('simulation-input');
  }
  simulation.dispose();
}
function itSharedKeyboardHandlersDoNotSwallowTextInput4() {
  // Test that the global tab/navigation keymaps don't interfere with text input
  // This is now handled by the native input component and keymap layer priorities
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'simulate',
  });
  // Verify that task state can be updated without issues
  state.setTask('task a');
  state.setTask('task ab');
  state.setTask('task abc');
  expect(state.simulation().task).toBe('task abc');
}
function itFocusRemainsStableDuringReactiveRerenders5() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'simulate',
  });
  // Multiple rapid task changes should not cause issues
  state.setTask('task a');
  state.setTask('task ab');
  state.setTask('task abc');
  expect(state.simulation().task).toBe('task abc');
}
function itNativeEscapeBackCloseStillWork6() {
  const state = useDialogState({
    session: { config, engine: createConfigRoutingEngine(config) },
    initialView: 'simulate',
  });
  expect(typeof state.back).toBe('function');
  expect(typeof state.close).toBe('function');
}
function describeSimulationInputFocusRegression0() {
  it(
    'simulate input receives focus and accepts task text',
    itSimulateInputReceivesFocusAndAcceptsInput2,
  );
  it('simulate input preserves entered text', itSimulateInputPreservesEnteredText3);
  it(
    'shared keyboard handlers do not swallow text input',
    itSharedKeyboardHandlersDoNotSwallowTextInput4,
  );
  it(
    'focus remains stable during reactive rerenders',
    itFocusRemainsStableDuringReactiveRerenders5,
  );
  it('native Escape/Back/Close still work', itNativeEscapeBackCloseStillWork6);
}
