/**
 * QuotaWeave System: read-only view of Agent Mesh configuration,
 * OpenCode integration and runtime diagnostics.
 *
 * Presents existing configuration and known limitations.
 * Does not fabricate runtime health or connectivity data.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { type Component } from 'solid-js';
import { ScrollRegion } from '../components/ScrollRegion.js';
import { Row, Section } from '../dialog/Primitives.js';
import { QUOTAWEAVE_VERSION } from '../types.js';

interface SystemViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
}

function yesNo(value: boolean | undefined): string {
  return value ? 'Yes' : 'No';
}

function formatMode(mode: 'off' | 'manual' | 'auto' | undefined): string {
  if (mode === 'auto') return 'Auto';
  if (mode === 'manual') return 'Manual';
  return 'Off';
}

const IntegrationStatusSection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const multiAgent = props.config.multiAgent;

  return (
    <Section title="INTEGRATION STATUS">
      <Row label="Plugin version" value={QUOTAWEAVE_VERSION} />
      <Row
        label="Configuration"
        value="Loaded"
        valueColor={context.theme.text.feedback.success.base}
      />
      <Row
        label="Agent Mesh"
        value={multiAgent ? formatMode(multiAgent.mode) : 'Off'}
        valueColor={
          multiAgent && multiAgent.mode !== 'off'
            ? context.theme.text.feedback.success.base
            : context.theme.text.feedback.warning.base
        }
      />
      <Row
        label="Routing Core"
        value="Available"
        valueColor={context.theme.text.feedback.success.base}
      />
      <Row
        label="MCP server"
        value="Connection not verified"
        valueColor={context.theme.text.faint}
      />
    </Section>
  );
};

function formatAgentMeshMode(
  multiAgent: NonNullable<ResolvedRoutingConfig['multiAgent']> | undefined,
): string {
  return multiAgent ? formatMode(multiAgent.mode) : 'Off';
}

function agentMeshModeColor(
  context: ReturnType<typeof usePlugin>,
  multiAgent: NonNullable<ResolvedRoutingConfig['multiAgent']> | undefined,
): ReturnType<typeof usePlugin>['theme']['text']['feedback']['success']['base'] {
  return multiAgent && multiAgent.mode !== 'off'
    ? context.theme.text.feedback.success.base
    : context.theme.text.feedback.warning.base;
}

function formatAgentMeshValue(
  multiAgent: NonNullable<ResolvedRoutingConfig['multiAgent']> | undefined,
  getter: (config: NonNullable<ResolvedRoutingConfig['multiAgent']>) => string,
): string {
  return multiAgent ? getter(multiAgent) : 'N/A';
}

const AgentMeshSection: Component<{ readonly config: ResolvedRoutingConfig }> = (props) => {
  const context = usePlugin();
  const multiAgent = props.config.multiAgent;
  const mode = formatAgentMeshMode(multiAgent);
  const modeColor = agentMeshModeColor(context, multiAgent);
  const value = (getter: (config: NonNullable<ResolvedRoutingConfig['multiAgent']>) => string) =>
    formatAgentMeshValue(multiAgent, getter);

  return (
    <Section title="AGENT MESH">
      <Row label="Mode" value={mode} valueColor={modeColor} />
      <Row label="Preview required" value={value((config) => yesNo(config.requirePreview))} />
      <Row label="Stop on failure" value={value((config) => yesNo(config.stopOnModelFailure))} />
      <Row
        label="Parallel FS writes"
        value={value((config) => yesNo(!config.noParallelFsWrites))}
      />
      <Row
        label="Guards / allowlists"
        value={value(
          (config) =>
            `${config.enforceGuards ? 'guards' : 'relaxed'}  ·  ${config.enforceAllowlists ? 'allowlists' : 'relaxed'}`,
        )}
      />
      <Row
        label="Preview quota"
        value={value((config) =>
          config.previewNoQuotaConsumption ? 'No quota consumed' : 'Quota consumed',
        )}
      />
      <Row
        label="Implementation status"
        value="Configuration only — execution not yet implemented"
        valueColor={context.theme.text.feedback.info.base}
      />
    </Section>
  );
};

const RuntimeDiagnosticsSection: Component<{ readonly config: ResolvedRoutingConfig }> = (
  props,
) => {
  const context = usePlugin();
  const config = props.config;

  return (
    <Section title="RUNTIME DIAGNOSTICS">
      <Row
        label="Plugin build"
        value="Local development build"
        valueColor={context.theme.text.faint}
      />
      <Row
        label="Configuration source"
        value="Project + global (merged)"
        valueColor={context.theme.text.faint}
      />
      <Row label="Routing categories" value={`${config.categories.length} configured`} />
      <Row label="Approved models" value={`${config.models.length}`} />
      <Row label="Cost policy" value={config.costPolicy.freeOnly ? 'Free-only' : 'Paid allowed'} />
      <Row
        label="Cooldown tracking"
        value={config.cooldownConfig.enabled ? 'Enabled' : 'Disabled'}
      />
      <Row label="Shadow mode" value={config.shadowMode.enabled ? 'Enabled' : 'Disabled'} />
      <Row
        label="Live quota data"
        value="Not exposed"
        valueColor={context.theme.text.feedback.warning.base}
      />
      <Row
        label="Provider connectivity"
        value="Not probed"
        valueColor={context.theme.text.feedback.warning.base}
      />
      <Row
        label="Agent execution"
        value="Not implemented"
        valueColor={context.theme.text.feedback.warning.base}
      />
    </Section>
  );
};

const SystemLimitationsSection: Component = () => {
  return (
    <Section title="SYSTEM LIMITATIONS">
      <Row label="Background" value="Title generation and compaction may bypass QuotaWeave" />
      <Row label="Subagents" value="Delegation is not yet implemented (ADR-002)" />
      <Row label="Provider calls" value="Direct HTTP calls are not intercepted" />
      <Row
        label="Agent Mesh execution"
        value="Configuration accepted; orchestration not implemented"
      />
      <Row label="MCP integration" value="Server scaffold exists; not connected to OpenCode" />
      <Row label="Model management" value="TUI-based CRUD postponed to post-v1 stabilization" />
    </Section>
  );
};

export const SystemView: Component<SystemViewProps> = (props) => {
  return (
    <ScrollRegion
      autofocus={true}
      initialScrollTop={props.initialScrollTop}
      onScrollPositionChange={props.onScrollPositionChange}
    >
      <box flexDirection="column" gap={1} width="100%">
        <IntegrationStatusSection config={props.config} />
        <AgentMeshSection config={props.config} />
        <RuntimeDiagnosticsSection config={props.config} />
        <SystemLimitationsSection />
      </box>
    </ScrollRegion>
  );
};
