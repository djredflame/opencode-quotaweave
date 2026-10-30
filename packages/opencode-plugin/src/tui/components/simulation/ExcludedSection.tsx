/**
 * Excluded simulation candidates and their reasons.
 */

import type { SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, type Component } from 'solid-js';
import { Badge, Section } from '../../dialog/Primitives.js';
import { costColor, costLabel, formatScore } from '../../format.js';

interface ExcludedSectionProps {
  readonly result: SimulationResult;
}

export const ExcludedSection: Component<ExcludedSectionProps> = (props) => {
  const context = usePlugin();
  const excluded = () => props.result.candidates.filter((candidate) => candidate.excluded);

  if (excluded().length === 0) {
    return (
      <Section title="EXCLUDED CANDIDATES">
        <text fg={context.theme.text.feedback.success.base}>
          No candidates were excluded. Every evaluated model passed policy checks.
        </text>
      </Section>
    );
  }

  return (
    <Section title={`EXCLUDED CANDIDATES (${excluded().length})`}>
      <For each={excluded()}>
        {(candidate) => (
          <box flexDirection="column" paddingLeft={1} gap={0}>
            <box flexDirection="row" flexWrap="wrap" gap={1} alignItems="center">
              <text fg={context.theme.text.base} attributes={1}>
                {candidate.model.id}
              </text>
              <text fg={context.theme.text.muted}>{candidate.model.provider}</text>
              <Badge
                label={costLabel(candidate.model.costClassification)}
                color={costColor(context.theme, candidate.model.costClassification)}
              />
              <text fg={context.theme.text.faint}>
                score {formatScore(candidate.scoreBreakdown.totalScore)}
              </text>
            </box>
            <text fg={context.theme.text.muted} wrapMode="word">
              Capabilities: {candidate.model.capabilities.join(', ') || 'none'}
            </text>
            <For each={candidate.exclusionReasons}>
              {(reason) => (
                <text fg={context.theme.text.feedback.error.muted} wrapMode="word">
                  • {reason}
                </text>
              )}
            </For>
          </box>
        )}
      </For>
    </Section>
  );
};
