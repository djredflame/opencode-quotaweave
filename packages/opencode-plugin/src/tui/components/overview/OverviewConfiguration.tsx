/**
 * Retained Agent Mesh details for Overview.
 *
 * This section stays visible until the System destination
 * receives its detailed implementation.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { Row, Section } from '../../dialog/Primitives.js';

interface OverviewConfigurationProps {
  readonly config: ResolvedRoutingConfig;
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

const AgentMeshSection: Component<OverviewConfigurationProps> = (props) => {
  const context = usePlugin();
  const multiAgent = () => props.config.multiAgent;
  const mode = () => {
    if (multiAgent()?.mode === 'auto') return 'Auto';
    if (multiAgent()?.mode === 'manual') return 'Manual';
    return 'Off';
  };
  const value = (getter: (config: NonNullable<ResolvedRoutingConfig['multiAgent']>) => string) => {
    const config = multiAgent();
    return config ? getter(config) : 'N/A';
  };

  return (
    <Section title="AGENT MESH">
      <Row
        label="Mode"
        value={mode()}
        valueColor={
          multiAgent()?.mode === 'off' || multiAgent() === undefined
            ? context.theme.text.feedback.warning.base
            : context.theme.text.feedback.success.base
        }
      />
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
    </Section>
  );
};

export const OverviewConfiguration: Component<OverviewConfigurationProps> = (props) => {
  return <AgentMeshSection config={props.config} />;
};
