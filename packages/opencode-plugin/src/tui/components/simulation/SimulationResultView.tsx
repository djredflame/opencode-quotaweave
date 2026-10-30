/**
 * Routing Inspector result view.
 */

import type { ResolvedRoutingConfig, SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { DialogAction } from '../../dialog/DialogAction.js';
import { Badge } from '../../dialog/Primitives.js';
import { TabBar } from '../../dialog/TabBar.js';
import { decisionColor, strategyLabel } from '../../format.js';
import { isSimulationSection, SIMULATION_SECTIONS } from '../../state.js';
import type { SimulationSection } from '../../types.js';
import { ScrollRegion } from '../ScrollRegion.js';
import { CandidatesSection } from '../simulation/CandidatesSection.js';
import { DecisionSection } from '../simulation/DecisionSection.js';
import { DetailsSection } from '../simulation/DetailsSection.js';
import { ExcludedSection } from '../simulation/ExcludedSection.js';
import { SummarySection } from '../simulation/SummarySection.js';

interface SimulationResultViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly result: SimulationResult;
  readonly task: string;
  readonly section: SimulationSection;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
  readonly onDismiss: () => void;
  readonly onSectionChange: (section: SimulationSection) => void;
}

interface ResultHeaderProps {
  readonly result: SimulationResult;
  readonly task: string;
  readonly categoryName: string;
  readonly onDismiss: () => void;
}

interface ResultBodyProps {
  readonly result: SimulationResult;
  readonly config: ResolvedRoutingConfig;
  readonly task: string;
  readonly section: SimulationSection;
  readonly categoryName: string;
}

const ResultHeader: Component<ResultHeaderProps> = (props) => {
  const context = usePlugin();
  const selected = () => props.result.selectedModel;
  return (
    <box flexDirection="column" gap={0} flexShrink={0}>
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <text fg={context.theme.text.base} attributes={1}>
          Simulation Result
        </text>
        <DialogAction label="Back to input" onTrigger={props.onDismiss} />
      </box>
      <text fg={context.theme.text.muted} overflow="hidden" wrapMode="none">
        {props.task}
      </text>
      <box flexDirection="row" flexWrap="wrap" gap={2} alignItems="center">
        <Badge label={props.categoryName} color={context.theme.text.action.primary.base} />
        <text fg={context.theme.text.faint}>{strategyLabel(props.result.metadata.strategy)}</text>
        <Badge
          label={props.result.permitted ? 'Permitted' : 'Rejected'}
          color={decisionColor(context.theme, props.result.permitted)}
        />
        <text fg={context.theme.text.faint} overflow="hidden" wrapMode="none" flexGrow={1}>
          {selected()
            ? `${selected()?.model.id}  ·  ${selected()?.model.provider}`
            : 'No eligible model'}
        </text>
      </box>
    </box>
  );
};

const ResultBody: Component<ResultBodyProps> = (props) => {
  switch (props.section) {
    case 'decision':
      return <DecisionSection result={props.result} config={props.config} />;
    case 'candidates':
      return <CandidatesSection result={props.result} />;
    case 'excluded':
      return <ExcludedSection result={props.result} />;
    case 'details':
      return <DetailsSection result={props.result} />;
    default:
      return (
        <SummarySection result={props.result} task={props.task} categoryName={props.categoryName} />
      );
  }
};

export const SimulationResultView: Component<SimulationResultViewProps> = (props) => {
  const categoryName = () =>
    props.config.categories.find((category) => category.id === props.result.category)?.name ??
    props.result.category;

  const handleTab = (id: string) => {
    if (isSimulationSection(id)) props.onSectionChange(id);
  };

  return (
    <box flexDirection="column" gap={1} flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
      <ResultHeader
        result={props.result}
        task={props.task}
        categoryName={categoryName()}
        onDismiss={props.onDismiss}
      />
      <TabBar
        scope="sections"
        tabs={SIMULATION_SECTIONS}
        active={props.section}
        onChange={handleTab}
      />
      <ScrollRegion
        autofocus={true}
        initialScrollTop={props.initialScrollTop}
        onScrollPositionChange={props.onScrollPositionChange}
      >
        <ResultBody
          result={props.result}
          config={props.config}
          task={props.task}
          section={props.section}
          categoryName={categoryName()}
        />
      </ScrollRegion>
    </box>
  );
};
