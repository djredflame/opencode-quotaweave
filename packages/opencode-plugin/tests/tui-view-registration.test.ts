/**
 * Registration regression tests for the real dialog view dispatcher.
 *
 * These tests exercise renderActiveView (the function DialogLayout mounts for
 * the active tab) instead of a standalone RoutingView render, so a view can no
 * longer silently fall back to PlaceholderView.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('@opentui/solid', () => ({
  createComponent: (component: (props: unknown) => unknown, props: unknown) => component(props),
}));
vi.mock('../src/tui/views/OverviewView.js', () => ({
  OverviewView: () => ({ marker: 'overview' }),
}));
vi.mock('../src/tui/views/ModelExplorerView.js', () => ({
  ModelExplorerView: () => ({ marker: 'models' }),
}));
vi.mock('../src/tui/views/RoutingView.js', () => ({
  RoutingView: () => ({ marker: 'routing' }),
}));
vi.mock('../src/tui/views/SimulationView.js', () => ({
  SimulationView: () => ({ marker: 'simulate' }),
}));
vi.mock('../src/tui/views/PoliciesView.js', () => ({
  PoliciesView: () => ({ marker: 'policies' }),
}));
vi.mock('../src/tui/views/SystemView.js', () => ({
  SystemView: () => ({ marker: 'system' }),
}));
vi.mock('../src/tui/views/PlaceholderView.js', () => ({
  PlaceholderView: (props: { title: string }) => ({ marker: 'placeholder', title: props.title }),
}));
const { renderActiveView } = await import('../src/tui/dialog/render-view.js');
const { VIEW_TABS, viewTab } = await import('../src/tui/tabs.js');
function dispatch(view: string) {
  return renderActiveView({
    session: {} as never,
    state: {} as never,
    view: view as never,
  }) as unknown as {
    marker?: string;
    title?: string;
  };
}
describe('dialog view registration', describeDialogViewRegistration0);
function itRendersTheImplementedRoutingViewForTheRouting1() {
  expect(viewTab('routing').placeholder).toBe(false);
  expect(dispatch('routing').marker).toBe('routing');
}
function itRoutesEveryMainTabToTheIntended2() {
  expect(dispatch('overview').marker).toBe('overview');
  expect(dispatch('models').marker).toBe('models');
  expect(dispatch('routing').marker).toBe('routing');
  expect(dispatch('simulate').marker).toBe('simulate');
  expect(dispatch('policies').marker).toBe('policies');
  expect(dispatch('system').marker).toBe('system');
}
function itKeepsExactlySixMainTabsWithStable3() {
  expect(VIEW_TABS.map((tab) => tab.id)).toEqual([
    'overview',
    'models',
    'routing',
    'policies',
    'simulate',
    'system',
  ]);
  expect(VIEW_TABS.filter((tab) => tab.placeholder).map((tab) => tab.id)).toEqual([]);
}
function describeDialogViewRegistration0() {
  it(
    'renders the implemented RoutingView for the routing tab',
    itRendersTheImplementedRoutingViewForTheRouting1,
  );
  it(
    'routes every main tab to the intended view or placeholder',
    itRoutesEveryMainTabToTheIntended2,
  );
  it(
    'keeps exactly six main tabs with stable routing metadata',
    itKeepsExactlySixMainTabsWithStable3,
  );
}
