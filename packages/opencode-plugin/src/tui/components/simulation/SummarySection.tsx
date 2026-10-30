/**
 * Simulation result summary.
 */

import type { SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, type Component } from 'solid-js';
import { Badge, Row, Section } from '../../dialog/Primitives.js';
import {
  costColor,
  costLabel,
  decisionColor,
  formatCostPer1k,
  formatLatency,
  formatRemainingMs,
  formatScore,
  strategyLabel,
} from '../../format.js';

interface SummarySectionProps {
  readonly result: SimulationResult;
  readonly task: string;
  readonly categoryName: string;
}

const DecisionSummary: Component<SummarySectionProps> = (props) => {
  const context = usePlugin();
  return (
    <Section title="DECISION">
      <Row label="Task" value={props.task} />
      <Row
        label="Category"
        value={`${props.categoryName}  ·  ${props.result.metadata.heuristicCategory ? 'inferred (heuristic)' : 'explicit'}`}
      />
      <Row label="Strategy" value={strategyLabel(props.result.metadata.strategy)} />
      <Row
        label="Cost policy"
        value={props.result.costPolicy.freeOnly ? 'Free-only' : 'Paid allowed'}
      />
      <Row
        label="Result"
        value={props.result.permitted ? 'Permitted' : 'Rejected'}
        valueColor={decisionColor(context.theme, props.result.permitted)}
      />
      <Row label="Decision time" value={`${props.result.metadata.decisionTimeMs}ms`} />
      {props.result.rejectionReason ? (
        <Row
          label="Rejection reason"
          value={props.result.rejectionReason}
          valueColor={context.theme.text.feedback.error.base}
        />
      ) : null}
    </Section>
  );
};

const SelectedModelSummary: Component<Pick<SummarySectionProps, 'result'>> = (props) => {
  const context = usePlugin();
  const selected = () => props.result.selectedModel;
  if (!selected()) {
    return (
      <Section title="SELECTED MODEL">
        <text fg={context.theme.text.feedback.error.base}>
          {props.result.rejectionReason ?? 'All candidates were excluded by policy.'}
        </text>
      </Section>
    );
  }
  return (
    <Section title="SELECTED MODEL">
      <Row label="Model ID" value={selected()?.model.id ?? ''} />
      <Row label="Provider" value={selected()?.model.provider ?? ''} />
      <Row label="Display name" value={selected()?.model.displayName ?? 'N/A'} />
      <Row
        label="Cost classification"
        value={costLabel(selected()?.model.costClassification ?? 'unknown')}
        valueColor={costColor(context.theme, selected()?.model.costClassification ?? 'unknown')}
      />
      <Row
        label="Cost per 1k"
        value={formatCostPer1k(selected()?.model.estimatedCostPer1kTokens)}
      />
      <Row label="Latency" value={formatLatency(selected()?.model.estimatedLatencyMs)} />
      <Row label="Priority" value={(selected()?.model.priority ?? 0).toString()} />
      <Row label="Capabilities" value={selected()?.model.capabilities.join(', ') ?? 'none'} />
      <Row label="Total score" value={formatScore(selected()?.scoreBreakdown.totalScore ?? 0)} />
    </Section>
  );
};

const CooldownSummary: Component<Pick<SummarySectionProps, 'result'>> = (props) => {
  const context = usePlugin();
  if (props.result.activeCooldowns.length === 0) return <></>;
  return (
    <Section title="ACTIVE COOLDOWNS">
      <For each={props.result.activeCooldowns}>
        {(cooldown) => (
          <Row
            label={`${cooldown.modelId} (${cooldown.provider})`}
            value={`${formatRemainingMs(cooldown.remainingMs)} remaining  ·  ${cooldown.reason}`}
            valueColor={context.theme.text.feedback.warning.base}
          />
        )}
      </For>
    </Section>
  );
};

const CountsSummary: Component<Pick<SummarySectionProps, 'result'>> = (props) => {
  const context = usePlugin();
  return (
    <Section title="COUNTS">
      <box flexDirection="row" flexWrap="wrap" gap={1}>
        <Badge
          label={`${props.result.candidates.length} evaluated`}
          color={context.theme.text.base}
        />
        <Badge
          label={`${props.result.candidates.filter((candidate) => candidate.excluded).length} excluded`}
          color={context.theme.text.feedback.error.base}
        />
        <Badge
          label={`${props.result.candidates.filter((candidate) => !candidate.excluded).length} considered`}
          color={context.theme.text.feedback.success.base}
        />
      </box>
      <Row label="Request ID" value={props.result.metadata.requestId} />
      <Row label="Timestamp" value={new Date(props.result.metadata.timestamp).toISOString()} />
    </Section>
  );
};

export const SummarySection: Component<SummarySectionProps> = (props) => {
  return (
    <>
      <DecisionSummary {...props} />
      <SelectedModelSummary result={props.result} />
      <CooldownSummary result={props.result} />
      <CountsSummary result={props.result} />
    </>
  );
};
