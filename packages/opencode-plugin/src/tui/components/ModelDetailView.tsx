/**
 * Detailed inspector for one configured model.
 */

import type { ModelConfig, ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, Show, type Component } from 'solid-js';
import { DialogAction } from '../dialog/DialogAction.js';
import { Badge, Row, Section, Tag } from '../dialog/Primitives.js';
import {
  costColor,
  costLabel,
  enabledColor,
  formatCostPer1k,
  formatLatency,
  strategyLabel,
} from '../format.js';
import { categoriesForModel } from '../state.js';
import { ScrollRegion } from './ScrollRegion.js';

interface ModelDetailProps {
  readonly config: ResolvedRoutingConfig;
  readonly model: ModelConfig;
}

interface ModelDetailViewProps extends ModelDetailProps {
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
  readonly onBack: () => void;
}

function metadataText(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

const IdentityStatus: Component<ModelDetailProps> = (props) => {
  const context = usePlugin();
  return (
    <Section title="IDENTITY & STATUS">
      <Row label="Model ID" value={props.model.id} />
      <Row label="Provider" value={props.model.provider} />
      <Row label="Display name" value={props.model.displayName ?? 'N/A'} />
      <Row
        label="Status"
        value={props.model.enabled ? 'Enabled' : 'Disabled'}
        valueColor={enabledColor(context.theme, props.model.enabled)}
      />
      <Row
        label="Cost classification"
        value={costLabel(props.model.costClassification)}
        valueColor={costColor(context.theme, props.model.costClassification)}
      />
    </Section>
  );
};

const BasicMetadata: Component<ModelDetailProps> = (props) => {
  return (
    <Section title="BASIC METADATA">
      <Row label="Priority" value={props.model.priority.toString()} />
      <Row label="Cost per 1k" value={formatCostPer1k(props.model.estimatedCostPer1kTokens)} />
      <Row label="Latency" value={formatLatency(props.model.estimatedLatencyMs)} />
    </Section>
  );
};

const Capabilities: Component<ModelDetailProps> = (props) => {
  return (
    <Section title="CAPABILITIES">
      <box flexDirection="row" flexWrap="wrap" gap={1}>
        <For each={props.model.capabilities}>{(capability) => <Tag label={capability} />}</For>
      </box>
    </Section>
  );
};

const AssignedCategories: Component<ModelDetailProps> = (props) => {
  const context = usePlugin();
  const assigned = () => categoriesForModel(props.config, props.model.id);

  return (
    <Section title="ASSIGNED CATEGORIES">
      <For each={assigned().enabled}>
        {(category) => (
          <Row
            label={category.name}
            value={`${category.id}  ·  ${strategyLabel(category.defaultStrategy ?? props.config.defaultStrategy)}`}
            detail={category.description}
          />
        )}
      </For>
      <For each={assigned().disabled}>
        {(category) => (
          <Row
            label={category.name}
            value={`${category.id}  ·  disabled category`}
            valueColor={context.theme.text.feedback.error.base}
          />
        )}
      </For>
      {assigned().enabled.length === 0 && assigned().disabled.length === 0 ? (
        <text fg={context.theme.text.muted}>No categories include this model.</text>
      ) : null}
    </Section>
  );
};

const CostsAndLatency: Component<ModelDetailProps> = (props) => {
  const context = usePlugin();
  return (
    <Section title="COSTS & LATENCY">
      <Row
        label="Cost per 1k tokens"
        value={formatCostPer1k(props.model.estimatedCostPer1kTokens)}
      />
      <Row label="Estimated latency" value={formatLatency(props.model.estimatedLatencyMs)} />
      <Row
        label="Cost classification"
        value={costLabel(props.model.costClassification)}
        valueColor={costColor(context.theme, props.model.costClassification)}
      />
    </Section>
  );
};

const FallbackChain: Component<ModelDetailProps> = (props) => {
  const context = usePlugin();
  const fallbacks = () => props.model.fallbacks ?? [];
  const providerName = (id: string) =>
    props.config.models.find((candidate) => candidate.id === id)?.provider ?? 'not configured';

  return (
    <Section title="FALLBACK CHAIN">
      {fallbacks().length > 0 ? (
        <For each={fallbacks()}>
          {(fallback, index) => (
            <Row
              label={`${index() + 1}.`}
              value={`${fallback}  ·  ${providerName(fallback)}`}
              labelWidth={4}
            />
          )}
        </For>
      ) : (
        <text fg={context.theme.text.muted}>No fallback models configured.</text>
      )}
    </Section>
  );
};

const Metadata: Component<ModelDetailProps> = (props) => {
  const entries = () => Object.entries(props.model.metadata ?? {});
  return (
    <Show when={entries().length > 0}>
      <Section title="METADATA">
        <For each={entries()}>
          {([key, value]) => <Row label={key} value={metadataText(value)} />}
        </For>
      </Section>
    </Show>
  );
};

const DetailHeader: Component<ModelDetailProps & { readonly onBack: () => void }> = (props) => {
  const context = usePlugin();
  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
    >
      <box flexDirection="row" gap={1} alignItems="center" flexWrap="wrap">
        <text fg={context.theme.text.base} attributes={1}>
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
      <DialogAction label="Close details" onTrigger={props.onBack} />
    </box>
  );
};

export const ModelDetailView: Component<ModelDetailViewProps> = (props) => {
  const context = usePlugin();
  return (
    <box flexDirection="column" flexGrow={1} flexBasis={0} minHeight={0} gap={1} overflow="hidden">
      <DetailHeader config={props.config} model={props.model} onBack={props.onBack} />
      <ScrollRegion
        initialScrollTop={props.initialScrollTop}
        onScrollPositionChange={props.onScrollPositionChange}
      >
        <IdentityStatus config={props.config} model={props.model} />
        <BasicMetadata config={props.config} model={props.model} />
        <Capabilities config={props.config} model={props.model} />
        <AssignedCategories config={props.config} model={props.model} />
        <CostsAndLatency config={props.config} model={props.model} />
        <FallbackChain config={props.config} model={props.model} />
        <Metadata config={props.config} model={props.model} />
        <Section title="RUNTIME">
          <text fg={context.theme.text.muted}>
            Cooldown and eligibility state is evaluated by the routing engine during simulation.
          </text>
        </Section>
      </ScrollRegion>
    </box>
  );
};
