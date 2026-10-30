/**
 * Fixed global routing summary shown above the category panes.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { Row, Section, Disclosure } from '../../dialog/Primitives.js';
import { formatWeights, strategyLabel } from '../../format.js';
import { ROUTING_CATEGORY_IDS, readinessDetail, type RoutingSummary } from '../../routing-data.js';

interface RoutingSummaryBarProps {
  readonly summary: RoutingSummary;
}

function capsLabel(summary: RoutingSummary): string {
  const request =
    summary.maxCostPerRequest === undefined
      ? 'no request cap'
      : `max/request $${summary.maxCostPerRequest.toFixed(4)}`;
  const session =
    summary.maxCostPerSession === undefined
      ? 'no session cap'
      : `max/session $${summary.maxCostPerSession.toFixed(2)}`;
  return `${request}  ·  ${session}`;
}

export const RoutingSummaryBar: Component<RoutingSummaryBarProps> = (props) => {
  const context = usePlugin();
  const s = props.summary;

  return (
    <box flexDirection="column" flexShrink={0} overflow="hidden" gap={1}>
      <Section title="ROUTING SUMMARY">
        <Row
          label="Default"
          value={`${s.defaultCategoryName}  ·  ${strategyLabel(s.defaultStrategy)}`}
        />
        <Row
          label="Models"
          value={`${s.enabledModelCount} enabled  ·  ${s.disabledModelCount} disabled`}
        />
        <Row
          label="Categories"
          value={`${s.enabledCategoryCount} enabled  ·  ${s.configuredCategoryCount}/${ROUTING_CATEGORY_IDS.length} configured  ·  ${s.categoriesWithEnabledModels} with models`}
        />
        <Row
          label="Policy"
          value={`${s.freeOnly ? 'Free-only' : 'Paid allowed'}  ·  cooldowns ${s.cooldownEnabled ? 'on' : 'off'}`}
        />
        <Disclosure title="Details" defaultOpen={false}>
          <Row
            label="Constraints"
            value={`${s.freeOnly ? 'Free-only' : 'Paid allowed'}  ·  ${capsLabel(s)}  ·  cooldowns ${s.cooldownEnabled ? 'on' : 'off'}`}
          />
          <text fg={context.theme.text.base} wrapMode="none" overflow="hidden" truncate={true}>
            Weights: {formatWeights(s.effectiveWeights)}
          </text>
          <text fg={context.theme.text.faint} wrapMode="word">
            {readinessDetail(s.readiness)}
          </text>
        </Disclosure>
      </Section>
    </box>
  );
};
