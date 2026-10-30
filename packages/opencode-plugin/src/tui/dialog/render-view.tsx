/**
 * Render the active QuotaWeave view from dialog state.
 */

import type { JSX } from '@opentui/solid';
import { viewTab } from '../tabs.js';
import type { QuotaWeaveSession, QuotaWeaveView } from '../types.js';
import { ModelExplorerView } from '../views/ModelExplorerView.js';
import { OverviewView } from '../views/OverviewView.js';
import { PlaceholderView } from '../views/PlaceholderView.js';
import { PoliciesView } from '../views/PoliciesView.js';
import { RoutingView } from '../views/RoutingView.js';
import { SimulationView } from '../views/SimulationView.js';
import { SystemView } from '../views/SystemView.js';
import type { DialogState } from './useDialogState.js';

interface ActiveViewProps {
  readonly session: QuotaWeaveSession;
  readonly state: DialogState;
  readonly view: QuotaWeaveView;
}

function renderModels(props: ActiveViewProps): JSX.Element {
  return (
    <ModelExplorerView
      config={props.session.config}
      filter={props.state.filter}
      selectedModel={props.state.selectedModel}
      listScrollTop={props.state.scrollPosition('modelList')}
      detailScrollTop={props.state.scrollPosition('modelDetail')}
      onFilterChange={props.state.setFilter}
      onSelectModel={props.state.setSelectedModel}
      onClearModel={props.state.clearSelectedModel}
      onListScrollChange={(scrollTop) => props.state.rememberScroll('modelList', scrollTop)}
      onDetailScrollChange={(scrollTop) => props.state.rememberScroll('modelDetail', scrollTop)}
    />
  );
}

function renderRouting(props: ActiveViewProps): JSX.Element {
  return (
    <RoutingView
      config={props.session.config}
      selectedCategory={props.state.selectedCategory()}
      listScrollTop={props.state.scrollPosition('routingList')}
      detailScrollTop={props.state.scrollPosition('routingDetail')}
      onSelectCategory={props.state.setSelectedCategory}
      onListScrollChange={(scrollTop) => props.state.rememberScroll('routingList', scrollTop)}
      onDetailScrollChange={(scrollTop) => props.state.rememberScroll('routingDetail', scrollTop)}
    />
  );
}

function renderSimulation(props: ActiveViewProps): JSX.Element {
  return (
    <SimulationView
      config={props.session.config}
      simulation={props.state.simulation()}
      inputScrollTop={props.state.scrollPosition('simulationInput')}
      resultScrollTop={props.state.scrollPosition('simulationResult')}
      onInputScrollChange={(scrollTop) => props.state.rememberScroll('simulationInput', scrollTop)}
      onResultScrollChange={(scrollTop) =>
        props.state.rememberScroll('simulationResult', scrollTop)
      }
      onTaskChange={props.state.setTask}
      onRun={props.state.runSimulation}
      onDismissResult={props.state.dismissResult}
      onSectionChange={props.state.setSection}
    />
  );
}

function renderPolicies(props: ActiveViewProps): JSX.Element {
  return (
    <PoliciesView
      config={props.session.config}
      initialScrollTop={props.state.scrollPosition('policies')}
      onScrollPositionChange={(scrollTop) => props.state.rememberScroll('policies', scrollTop)}
    />
  );
}

function renderOverview(props: ActiveViewProps): JSX.Element {
  return (
    <OverviewView
      config={props.session.config}
      initialScrollTop={props.state.scrollPosition('overview')}
      onScrollPositionChange={(scrollTop) => props.state.rememberScroll('overview', scrollTop)}
      onNavigate={props.state.setView}
    />
  );
}

function renderSystem(props: ActiveViewProps): JSX.Element {
  return (
    <SystemView
      config={props.session.config}
      initialScrollTop={props.state.scrollPosition('system')}
      onScrollPositionChange={(scrollTop) => props.state.rememberScroll('system', scrollTop)}
    />
  );
}

/** Choose the view the dialog is currently showing. */
export function renderActiveView(props: ActiveViewProps): JSX.Element {
  const tab = viewTab(props.view);
  if (tab.placeholder) {
    return <PlaceholderView title={tab.label} description={tab.description} />;
  }
  if (props.view === 'routing') return renderRouting(props);
  if (props.view === 'models') return renderModels(props);
  if (props.view === 'simulate') return renderSimulation(props);
  if (props.view === 'policies') return renderPolicies(props);
  if (props.view === 'system') return renderSystem(props);
  return renderOverview(props);
}
