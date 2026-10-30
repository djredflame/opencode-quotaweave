/**
 * Overview approved-model metrics and provider summary.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { type Component } from 'solid-js';
import { MetricCard, Row, Section } from '../../dialog/Primitives.js';
import { collectProviders } from '../../state.js';

interface OverviewMetricsProps {
  readonly config: ResolvedRoutingConfig;
}

export const OverviewMetrics: Component<OverviewMetricsProps> = (props) => {
  const context = usePlugin();
  const enabled = () => props.config.models.filter((model) => model.enabled).length;
  const providerCount = () => collectProviders(props.config.models).length;

  return (
    <Section title="MODELS">
      <box flexDirection="row" flexWrap="wrap" gap={1}>
        <MetricCard label="approved" value={props.config.models.length.toString()} />
        <MetricCard
          label="enabled"
          value={enabled().toString()}
          color={context.theme.text.feedback.success.base}
        />
        <MetricCard
          label="disabled"
          value={(props.config.models.length - enabled()).toString()}
          color={context.theme.text.feedback.warning.base}
        />
      </box>
      <Row label="Providers" value={`${providerCount()} configured`} />
      <text fg={context.theme.text.faint} wrapMode="word">
        Enabled reflects configuration. Per-provider details are available in Models.
      </text>
    </Section>
  );
};
