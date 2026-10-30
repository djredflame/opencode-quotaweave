/**
 * Raw simulation details and the local-only verification note.
 */

import type { SimulationResult } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { Section } from '../../dialog/Primitives.js';

interface DetailsSectionProps {
  readonly result: SimulationResult;
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

export const DetailsSection: Component<DetailsSectionProps> = (props) => {
  const context = usePlugin();

  return (
    <>
      <Section title="ZERO-QUOTA VERIFICATION">
        <text fg={context.theme.text.feedback.success.base}>
          No LLM calls, provider requests, model switches, or configuration changes were made.
        </text>
        <text fg={context.theme.text.feedback.success.base}>
          No quota or cooldown state was mutated. The result is deterministic local computation.
        </text>
      </Section>
      <Section title="METADATA">
        <text fg={context.theme.text.muted} wrapMode="word">
          {pretty(props.result.metadata)}
        </text>
      </Section>
      <Section title="COST POLICY">
        <text fg={context.theme.text.muted} wrapMode="word">
          {pretty(props.result.costPolicy)}
        </text>
      </Section>
      <Section title="CANDIDATES">
        <text fg={context.theme.text.muted} wrapMode="word">
          {pretty(props.result.candidates)}
        </text>
      </Section>
      <Section title="COOLDOWNS">
        <text fg={context.theme.text.muted} wrapMode="word">
          {pretty(props.result.activeCooldowns)}
        </text>
      </Section>
    </>
  );
};
