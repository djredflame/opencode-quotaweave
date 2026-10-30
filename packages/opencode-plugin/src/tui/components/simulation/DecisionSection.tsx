/**
 * Simulation decision breakdown.
 */

import type { ResolvedRoutingConfig, SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { Row, Section } from '../../dialog/Primitives.js';
import { formatPercent, formatScore, formatWeights, strategyLabel } from '../../format.js';

interface DecisionSectionProps {
  readonly result: SimulationResult;
  readonly config: ResolvedRoutingConfig;
}

function selectionReason(result: SimulationResult, categoryName: string): string {
  const selected = result.selectedModel;
  if (!selected) return result.rejectionReason ?? 'No eligible model was found.';
  const reasons: string[] = [];
  const breakdown = selected.scoreBreakdown;
  if (breakdown.capabilityMatch > 0.8) reasons.push('excellent capability match');
  else if (breakdown.capabilityMatch > 0.5) reasons.push('good capability match');
  if (breakdown.costScore > 0.7) reasons.push('cost efficient');
  if (breakdown.latencyScore > 0.7) reasons.push('low latency');
  if (breakdown.priorityScore > 0.7) reasons.push('high priority');
  if (reasons.length === 0) reasons.push('best available option');
  return `Selected ${selected.model.id} for ${categoryName}: ${reasons.join(', ')}. Score ${formatScore(breakdown.totalScore)}.`;
}

const ReasonSection: Component<DecisionSectionProps> = (props) => {
  const context = usePlugin();
  const category = () => props.config.categories.find((item) => item.id === props.result.category);
  return (
    <Section title="WHY THIS MODEL">
      <text fg={context.theme.text.base} wrapMode="word">
        {selectionReason(props.result, category()?.name ?? props.result.category)}
      </text>
    </Section>
  );
};

const InferenceSection: Component<DecisionSectionProps> = (props) => {
  const category = () => props.config.categories.find((item) => item.id === props.result.category);
  return (
    <Section title="CATEGORY INFERENCE">
      <Row
        label="Method"
        value={
          props.result.metadata.heuristicCategory
            ? 'Heuristic keyword inference'
            : 'Explicit category'
        }
      />
      <Row
        label="Category"
        value={`${props.result.category}  ·  ${category()?.name ?? props.result.category}`}
      />
      <Row label="Description" value={category()?.description ?? 'No description configured'} />
      <Row
        label="Category strategy"
        value={strategyLabel(category()?.defaultStrategy ?? props.config.defaultStrategy)}
      />
    </Section>
  );
};

const ScoringSection: Component<DecisionSectionProps> = (props) => {
  const selected = () => props.result.selectedModel;
  return (
    <Section title="STRATEGY & SCORING">
      <Row label="Strategy used" value={strategyLabel(props.result.metadata.strategy)} />
      <Row
        label="Weights"
        value={formatWeights(
          props.config.categories.find((item) => item.id === props.result.category)
            ?.strategyWeights ?? props.config.strategyWeights,
        )}
      />
      {selected() ? (
        <>
          <Row
            label="Capability match"
            value={formatPercent(selected()?.scoreBreakdown.capabilityMatch ?? 0)}
          />
          <Row
            label="Cost score"
            value={formatPercent(selected()?.scoreBreakdown.costScore ?? 0)}
          />
          <Row
            label="Latency score"
            value={formatPercent(selected()?.scoreBreakdown.latencyScore ?? 0)}
          />
          <Row
            label="Quota score"
            value={formatPercent(selected()?.scoreBreakdown.quotaScore ?? 0)}
          />
          <Row
            label="Priority score"
            value={formatPercent(selected()?.scoreBreakdown.priorityScore ?? 0)}
          />
          <Row
            label="Total score"
            value={formatScore(selected()?.scoreBreakdown.totalScore ?? 0)}
          />
        </>
      ) : null}
    </Section>
  );
};

const PolicySection: Component<DecisionSectionProps> = (props) => {
  const policy = () => props.result.costPolicy;
  return (
    <Section title="POLICY DECISIONS">
      <Row label="Free-only enforced" value={policy().freeOnly ? 'Yes' : 'No'} />
      <Row
        label="Max cost/request"
        value={
          policy().maxCostPerRequest === undefined
            ? 'N/A'
            : `$${policy().maxCostPerRequest?.toFixed(4)}`
        }
      />
      <Row label="Cooldowns" value={props.config.cooldownConfig.enabled ? 'Enabled' : 'Disabled'} />
      <Row label="Shadow mode" value={props.config.shadowMode.enabled ? 'Enabled' : 'Disabled'} />
      <Row label="Agent Mesh" value={props.config.multiAgent?.mode ?? 'Not configured'} />
    </Section>
  );
};

export const DecisionSection: Component<DecisionSectionProps> = (props) => {
  return (
    <>
      <ReasonSection result={props.result} config={props.config} />
      <InferenceSection result={props.result} config={props.config} />
      <ScoringSection result={props.result} config={props.config} />
      <PolicySection result={props.result} config={props.config} />
    </>
  );
};
