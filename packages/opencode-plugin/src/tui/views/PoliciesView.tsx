/**
 * QuotaWeave Policies: read-only configuration explorer.
 *
 * Presents cost, cooldown, and shadow policies from the resolved configuration.
 * Does not display invented runtime values (remaining quota, provider resets,
 * active cooldowns, actual spending, recovery status).
 */

import type {
  CooldownConfig,
  CostPolicyConfig,
  ResolvedRoutingConfig,
  ShadowModeConfig,
} from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, Show, type Component } from 'solid-js';
import { ScrollRegion } from '../components/ScrollRegion.js';
import { Row, Section } from '../dialog/Primitives.js';
import { formatPercent } from '../format.js';

interface PoliciesViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

function formatCost(value: number | undefined): string {
  if (value === undefined) return 'Not configured';
  return `$${value.toFixed(4)}`;
}

function formatCostSession(value: number | undefined): string {
  if (value === undefined) return 'Not configured';
  return `$${value.toFixed(2)}`;
}

function formatDuration(value: number): string {
  if (value < 1000) return `${value}ms`;
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

const CostPolicySection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const policy = () => props.config.costPolicy;

  return (
    <Section title="COST POLICY">
      <Row
        label="Free-only enforcement"
        value={policy().freeOnly ? 'Enabled' : 'Disabled'}
        valueColor={
          policy().freeOnly
            ? context.theme.text.feedback.warning.base
            : context.theme.text.feedback.success.base
        }
      />
      <Row label="Request cost cap" value={formatCost(policy().maxCostPerRequest)} />
      <Row label="Session cost cap" value={formatCostSession(policy().maxCostPerSession)} />
      <Row label="Warning threshold" value={formatPercent(policy().warnThreshold ?? 0.8)} />
      <Row
        label="Budget period"
        value={formatDuration((policy().budgetPeriodHours ?? 24) * 3600000)}
      />
    </Section>
  );
};

const CooldownPolicySection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const cooldown = () => props.config.cooldownConfig;

  return (
    <Section title="COOLDOWN POLICY">
      <Row
        label="Cooldown tracking"
        value={cooldown().enabled ? 'Enabled' : 'Disabled'}
        valueColor={
          cooldown().enabled
            ? context.theme.text.feedback.success.base
            : context.theme.text.feedback.warning.base
        }
      />
      <Row label="Default duration" value={formatDuration(cooldown().defaultCooldownMs)} />
      <Row label="Maximum duration" value={formatDuration(cooldown().maxCooldownMs)} />
      <Row label="Backoff multiplier" value={`${cooldown().backoffMultiplier}x`} />
      <Row label="Reset on success" value={cooldown().resetOnSuccess ? 'Yes' : 'No'} />
    </Section>
  );
};

const ShadowPolicySection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const shadow = () => props.config.shadowMode;
  const shadowModels = () => shadow().shadowModelIds ?? [];

  return (
    <Section title="SHADOW MODE">
      <Row
        label="Shadow execution"
        value={shadow().enabled ? 'Enabled' : 'Disabled'}
        valueColor={
          shadow().enabled
            ? context.theme.text.feedback.info.base
            : context.theme.text.feedback.warning.base
        }
      />
      <Row
        label="Shadow models"
        value={shadowModels().length > 0 ? shadowModels().join(', ') : 'None configured'}
      />
      <Row label="Log decisions" value={shadow().logDecisions ? 'Yes' : 'No'} />
      <Row label="Sample rate" value={formatPercent(shadow().sampleRate)} />
    </Section>
  );
};

function collectCostWarnings(policy: CostPolicyConfig): string[] {
  const result: string[] = [];
  if (policy.freeOnly && policy.maxCostPerRequest !== undefined) {
    result.push(
      'Free-only enforcement is active but a request cost cap is also configured. The cost cap is ignored in free-only mode.',
    );
  }
  if (policy.freeOnly && policy.maxCostPerSession !== undefined) {
    result.push(
      'Free-only enforcement is active but a session cost cap is also configured. The cost cap is ignored in free-only mode.',
    );
  }
  if (
    policy.warnThreshold !== undefined &&
    (policy.warnThreshold < 0 || policy.warnThreshold > 1)
  ) {
    result.push('Warning threshold must be between 0 and 1.');
  }
  if (policy.budgetPeriodHours !== undefined && policy.budgetPeriodHours < 1) {
    result.push('Budget period must be at least 1 hour.');
  }
  return result;
}

function collectCooldownWarnings(cooldown: CooldownConfig): string[] {
  const result: string[] = [];
  if (!cooldown.enabled) return result;
  if (cooldown.defaultCooldownMs > cooldown.maxCooldownMs) {
    result.push('Default cooldown exceeds maximum cooldown.');
  }
  if (cooldown.backoffMultiplier < 1) {
    result.push('Backoff multiplier must be >= 1.');
  }
  return result;
}

function collectShadowWarnings(shadow: ShadowModeConfig): string[] {
  const result: string[] = [];
  if (!shadow.enabled) return result;
  if (!shadow.shadowModelIds || shadow.shadowModelIds.length === 0) {
    result.push('Shadow mode is enabled but no shadow models are configured.');
  }
  if (shadow.sampleRate < 0 || shadow.sampleRate > 1) {
    result.push('Shadow sample rate must be between 0 and 1.');
  }
  return result;
}

const DiagnosticsSection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const policy = props.config.costPolicy;
  const cooldown = props.config.cooldownConfig;
  const shadow = props.config.shadowMode;

  const warnings = () => [
    ...collectCostWarnings(policy),
    ...collectCooldownWarnings(cooldown),
    ...collectShadowWarnings(shadow),
  ];

  return (
    <Section title="POLICY DIAGNOSTICS">
      <Show
        when={warnings().length > 0}
        fallback={
          <text fg={context.theme.text.feedback.success.base} wrapMode="word">
            No configuration issues detected.
          </text>
        }
      >
        <text fg={context.theme.text.feedback.warning.base} wrapMode="word">
          {warnings().length} configuration warning{warnings().length === 1 ? '' : 's'}:
        </text>
        <For each={warnings()}>
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

const RuntimeBoundarySection: Component = () => {
  const context = usePlugin();
  return (
    <Section title="RUNTIME BOUNDARY">
      <text fg={context.theme.text.faint} wrapMode="word">
        This view presents static configuration only. It does not show live provider quota,
        remaining budget, active cooldowns, actual spending, provider reset timestamps, API
        availability, or model recovery status. Those capabilities are planned for future stages.
      </text>
    </Section>
  );
};

export const PoliciesView: Component<PoliciesViewProps> = (props) => {
  return (
    <ScrollRegion
      autofocus={true}
      initialScrollTop={props.initialScrollTop}
      onScrollPositionChange={props.onScrollPositionChange}
    >
      <box flexDirection="column" gap={1} width="100%">
        <CostPolicySection config={props.config} />
        <CooldownPolicySection config={props.config} />
        <ShadowPolicySection config={props.config} />
        <DiagnosticsSection config={props.config} />
        <RuntimeBoundarySection />
      </box>
    </ScrollRegion>
  );
};
