/**
 * QuotaWeave Overview: a compact operational dashboard.
 *
 * Detailed category, weight and provider content lives in the dedicated
 * Routing and Models destinations. Policy and cooldown details have moved
 * to the dedicated Policies tab. Agent Mesh and integration details are
 * available in the System tab.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, Show, createMemo, type Component } from 'solid-js';
import { ScrollRegion } from '../components/ScrollRegion.js';
import { OverviewMetrics } from '../components/overview/OverviewMetrics.js';
import { Row, Section } from '../dialog/Primitives.js';
import { strategyLabel } from '../format.js';
import {
  ROUTING_CATEGORY_IDS,
  collectRoutingWarnings,
  readinessDetail,
  summarizeRouting,
  type RoutingSummary,
} from '../routing-data.js';
import type { QuotaWeaveView } from '../types.js';

interface OverviewViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
  readonly onNavigate: (view: QuotaWeaveView) => void;
}

const StatusSection: Component<Pick<OverviewViewProps, 'config'>> = (props) => {
  const context = usePlugin();
  return (
    <Section title="STATUS">
      <Row
        label="Configuration"
        value="Loaded"
        valueColor={context.theme.text.feedback.success.base}
      />
      <Row
        label="Cost policy"
        value={props.config.costPolicy.freeOnly ? 'Free-only' : 'Paid allowed'}
        valueColor={
          props.config.costPolicy.freeOnly
            ? context.theme.text.feedback.warning.base
            : context.theme.text.base
        }
      />
    </Section>
  );
};

interface RoutingStatusProps {
  readonly summary: RoutingSummary;
  readonly onNavigate: (view: QuotaWeaveView) => void;
}

const RoutingStatusSection: Component<RoutingStatusProps> = (props) => {
  const context = usePlugin();
  const readinessColor = () =>
    props.summary.readiness === 'ready'
      ? context.theme.text.feedback.success.base
      : context.theme.text.feedback.warning.base;

  return (
    <Section title="ROUTING">
      <Row
        label="Default"
        value={`${props.summary.defaultCategoryName}  ·  ${strategyLabel(props.summary.defaultStrategy)}`}
      />
      <Row
        label="Categories"
        value={`${props.summary.enabledCategoryCount} enabled  ·  ${props.summary.configuredCategoryCount}/${ROUTING_CATEGORY_IDS.length} configured`}
      />
      <Row
        label="Readiness"
        value={readinessDetail(props.summary.readiness)}
        valueColor={readinessColor()}
      />
    </Section>
  );
};

interface WarningsProps {
  readonly warnings: readonly string[];
}

const WarningsSection: Component<WarningsProps> = (props) => {
  const context = usePlugin();
  return (
    <Section title="WARNINGS">
      <Show
        when={props.warnings.length > 0}
        fallback={
          <text fg={context.theme.text.feedback.success.base} wrapMode="word">
            No configuration warnings detected.
          </text>
        }
      >
        <text fg={context.theme.text.feedback.warning.base} wrapMode="word">
          {props.warnings.length} configuration warning
          {props.warnings.length === 1 ? '' : 's'}:
        </text>
        <For each={props.warnings}>
          {(warning) => (
            <text fg={context.theme.text.feedback.warning.base} wrapMode="word">
              • {warning}
            </text>
          )}
        </For>
      </Show>
    </Section>
  );
};

export const OverviewView: Component<OverviewViewProps> = (props) => {
  const summary = createMemo(() => summarizeRouting(props.config));
  const warnings = createMemo(() => collectRoutingWarnings(props.config));

  return (
    <ScrollRegion
      autofocus={true}
      initialScrollTop={props.initialScrollTop}
      onScrollPositionChange={props.onScrollPositionChange}
    >
      <box flexDirection="column" gap={1} width="100%">
        <StatusSection config={props.config} />
        <OverviewMetrics config={props.config} />
        <RoutingStatusSection summary={summary()} onNavigate={props.onNavigate} />
        <WarningsSection warnings={warnings()} />
      </box>
    </ScrollRegion>
  );
};
