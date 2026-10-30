/**
 * All evaluated simulation candidates.
 */

import type { SimulationCandidate, SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, type Component } from 'solid-js';
import { Badge, Section } from '../../dialog/Primitives.js';
import { costColor, costLabel, formatScore } from '../../format.js';

interface CandidatesSectionProps {
  readonly result: SimulationResult;
}

interface CandidateRowProps {
  readonly candidate: SimulationCandidate;
  readonly index: number;
  readonly selected: boolean;
}

const CandidateRow: Component<CandidateRowProps> = (props) => {
  const context = usePlugin();
  return (
    <box
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={
        props.selected
          ? context.theme.background.action.primary.selected
          : context.theme.background.raised.base
      }
    >
      <box flexDirection="row" flexWrap="wrap" gap={1} alignItems="center">
        <text fg={context.theme.text.faint}>{props.index + 1}.</text>
        <text
          fg={props.selected ? context.theme.text.action.primary.focused : context.theme.text.base}
          attributes={props.selected ? 1 : 0}
        >
          {props.candidate.model.id}
        </text>
        <text fg={context.theme.text.muted}>{props.candidate.model.provider}</text>
        <Badge
          label={costLabel(props.candidate.model.costClassification)}
          color={costColor(context.theme, props.candidate.model.costClassification)}
        />
        {props.selected ? (
          <Badge label="selected" color={context.theme.text.feedback.success.base} />
        ) : null}
        {props.candidate.excluded ? (
          <Badge label="excluded" color={context.theme.text.feedback.error.base} />
        ) : null}
      </box>
      <text fg={context.theme.text.faint} wrapMode="word">
        score {formatScore(props.candidate.scoreBreakdown.totalScore)} · priority{' '}
        {props.candidate.model.priority} ·{' '}
        {props.candidate.model.capabilities.join(', ') || 'no capabilities'}
      </text>
      {props.candidate.excluded && props.candidate.exclusionReasons.length > 0 ? (
        <text fg={context.theme.text.feedback.error.muted} wrapMode="word">
          {props.candidate.exclusionReasons.join('; ')}
        </text>
      ) : null}
    </box>
  );
};

export const CandidatesSection: Component<CandidatesSectionProps> = (props) => {
  const isSelected = (modelId: string) => props.result.selectedModel?.model.id === modelId;

  return (
    <Section title={`EVALUATED CANDIDATES (${props.result.candidates.length})`}>
      <For each={props.result.candidates}>
        {(candidate, index) => (
          <CandidateRow
            candidate={candidate}
            index={index()}
            selected={isSelected(candidate.model.id)}
          />
        )}
      </For>
    </Section>
  );
};
