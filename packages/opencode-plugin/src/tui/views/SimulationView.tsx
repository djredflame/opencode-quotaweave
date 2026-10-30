/**
 * QuotaWeave Routing Inspector.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { Show, type Component } from 'solid-js';
import { SimulationInputView } from '../components/simulation/SimulationInputView.js';
import { SimulationResultView } from '../components/simulation/SimulationResultView.js';
import type { SimulationSection, SimulationUiState } from '../types.js';

interface SimulationViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly simulation: SimulationUiState;
  readonly inputScrollTop: number;
  readonly resultScrollTop: number;
  readonly onInputScrollChange: (scrollTop: number) => void;
  readonly onResultScrollChange: (scrollTop: number) => void;
  readonly onTaskChange: (task: string) => void;
  readonly onRun: () => void;
  readonly onDismissResult: () => void;
  readonly onSectionChange: (section: SimulationSection) => void;
}

export const SimulationView: Component<SimulationViewProps> = (props) => {
  return (
    <Show
      when={props.simulation.result}
      keyed
      fallback={
        <SimulationInputView
          config={props.config}
          task={props.simulation.task}
          initialScrollTop={props.inputScrollTop}
          onScrollPositionChange={props.onInputScrollChange}
          onTaskChange={props.onTaskChange}
          onRun={props.onRun}
        />
      }
    >
      {(result) => (
        <SimulationResultView
          config={props.config}
          result={result}
          task={props.simulation.task}
          section={props.simulation.section}
          initialScrollTop={props.resultScrollTop}
          onScrollPositionChange={props.onResultScrollChange}
          onDismiss={props.onDismissResult}
          onSectionChange={props.onSectionChange}
        />
      )}
    </Show>
  );
};
