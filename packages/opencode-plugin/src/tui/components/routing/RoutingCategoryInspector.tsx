/**
 * Read-only inspector for one routing category and its approved model pool.
 */

import type { ModelConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, type Component } from 'solid-js';
import { Badge, Row, Section } from '../../dialog/Primitives.js';
import {
  costColor,
  costLabel,
  enabledColor,
  formatCostPer1k,
  formatLatency,
  formatWeights,
  strategyLabel,
} from '../../format.js';
import type { CategoryPool } from '../../routing-data.js';
import { ScrollRegion } from '../ScrollRegion.js';

interface RoutingCategoryInspectorProps {
  readonly pool: CategoryPool;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

interface AssignedModelRowProps {
  readonly model: ModelConfig;
}

const AssignedModelRow: Component<AssignedModelRowProps> = (props) => {
  const context = usePlugin();
  const fallbackCount = () => props.model.fallbacks?.length ?? 0;

  return (
    <box
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={0}
      backgroundColor={context.theme.background.raised.base}
    >
      <box flexDirection="row" flexWrap="wrap" gap={1} alignItems="center" minWidth={0}>
        <text
          fg={context.theme.text.base}
          attributes={1}
          flexShrink={1}
          overflow="hidden"
          truncate={true}
        >
          {props.model.displayName ?? props.model.id}
        </text>
        <Badge
          label={props.model.enabled ? 'Enabled' : 'Disabled'}
          color={enabledColor(context.theme, props.model.enabled)}
        />
        <Badge
          label={costLabel(props.model.costClassification)}
          color={costColor(context.theme, props.model.costClassification)}
        />
      </box>
      <text fg={context.theme.text.faint} wrapMode="word" truncate={true} overflow="hidden">
        {props.model.id} · {props.model.provider} · priority {props.model.priority} ·{' '}
        {formatCostPer1k(props.model.estimatedCostPer1kTokens)} ·{' '}
        {formatLatency(props.model.estimatedLatencyMs)} · fallbacks {fallbackCount()}
      </text>
    </box>
  );
};

const IdentitySection: Component<Pick<RoutingCategoryInspectorProps, 'pool'>> = (props) => {
  const context = usePlugin();
  const status = () => {
    if (!props.pool.configured) return 'Not configured';
    return props.pool.enabled ? 'Enabled' : 'Disabled';
  };
  const statusColor = () => {
    if (!props.pool.configured) return context.theme.text.feedback.warning.base;
    return enabledColor(context.theme, props.pool.enabled);
  };

  return (
    <Section title="CATEGORY">
      <Row label="Name" value={props.pool.name} />
      <Row label="Identifier" value={props.pool.id} />
      <Row label="Status" value={status()} valueColor={statusColor()} />
      <Row label="Description" value={props.pool.description} />
    </Section>
  );
};

const PoolSummary: Component<Pick<RoutingCategoryInspectorProps, 'pool'>> = (props) => {
  const context = usePlugin();
  return (
    <Section title="MODEL POOL SUMMARY">
      <Row label="Assigned" value={props.pool.assignedModels.length.toString()} />
      <Row label="Enabled" value={props.pool.enabledModelCount.toString()} />
      <Row label="Disabled" value={props.pool.disabledModelCount.toString()} />
      {props.pool.unresolvedModelCount > 0 ? (
        <Row
          label="Unresolved"
          value={`${props.pool.unresolvedModelCount} references not in allowlist`}
          valueColor={context.theme.text.feedback.warning.base}
        />
      ) : null}
    </Section>
  );
};

const PoolSection: Component<Pick<RoutingCategoryInspectorProps, 'pool'>> = (props) => {
  const context = usePlugin();

  return (
    <Section title="ASSIGNED MODELS">
      {!props.pool.configured ? (
        <text fg={context.theme.text.feedback.warning.base} wrapMode="word">
          This category is not present in the active routing configuration.
        </text>
      ) : props.pool.assignedModels.length === 0 ? (
        <text fg={context.theme.text.feedback.warning.base} wrapMode="word">
          No approved models are assigned to this category.
        </text>
      ) : (
        <For each={props.pool.assignedModels}>{(model) => <AssignedModelRow model={model} />}</For>
      )}
    </Section>
  );
};

const StrategySection: Component<Pick<RoutingCategoryInspectorProps, 'pool'>> = (props) => {
  return (
    <Section title="ROUTING CONFIGURATION">
      <Row
        label="Strategy"
        value={`${strategyLabel(props.pool.strategy)}  ·  ${props.pool.strategyFromCategory ? 'category override' : 'global default'}`}
      />
      <Row label="Weights" value={formatWeights(props.pool.effectiveWeights)} />
      <Row
        label="Weights source"
        value={props.pool.weightsFromCategory ? 'Category override' : 'Global default'}
      />
    </Section>
  );
};

const RuntimeSection: Component = () => {
  const context = usePlugin();
  return (
    <Section title="RUNTIME DATA">
      <text fg={context.theme.text.muted} wrapMode="word">
        Runtime availability, cooldown state and live quota are not exposed in this configuration
        view. Enabled state is configuration, not an availability signal.
      </text>
    </Section>
  );
};

export const RoutingCategoryInspector: Component<RoutingCategoryInspectorProps> = (props) => {
  return (
    <ScrollRegion
      initialScrollTop={props.initialScrollTop}
      onScrollPositionChange={props.onScrollPositionChange}
    >
      <IdentitySection pool={props.pool} />
      <PoolSummary pool={props.pool} />
      <PoolSection pool={props.pool} />
      <StrategySection pool={props.pool} />
      <RuntimeSection />
    </ScrollRegion>
  );
};
