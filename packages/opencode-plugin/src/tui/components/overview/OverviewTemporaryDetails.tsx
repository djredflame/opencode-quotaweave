/**
 * Compact disclosure for details whose dedicated destinations are still
 * placeholders.
 *
 * System is not implemented yet, so Agent Mesh and integration details
 * remain available here until that view exists.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { useTerminalDimensions } from '@opentui/solid';
import { Show, createSignal, type Component } from 'solid-js';
import { ActionButton } from '../../dialog/ActionButton.js';
import { Row, Section } from '../../dialog/Primitives.js';
import { hasWideLayout } from '../../state.js';
import { OverviewConfiguration } from './OverviewConfiguration.js';

interface OverviewTemporaryDetailsProps {
  readonly config: ResolvedRoutingConfig;
}

const Limitations: Component = () => {
  return (
    <Section title="INTEGRATION LIMITS">
      <Row label="Background" value="Title generation and compaction may bypass QuotaWeave" />
      <Row label="Subagents" value="Delegation is not yet implemented (ADR-002)" />
      <Row label="Provider calls" value="Direct HTTP calls are not intercepted" />
    </Section>
  );
};

export const OverviewTemporaryDetails: Component<OverviewTemporaryDetailsProps> = (props) => {
  const context = usePlugin();
  const dimensions = useTerminalDimensions();
  const [expanded, setExpanded] = createSignal(false);

  return (
    <Section title="TEMPORARY DETAILS">
      <text fg={context.theme.text.faint} wrapMode="word">
        Agent Mesh and integration details remain here until System is implemented.
      </text>
      <box flexDirection="row" flexWrap="wrap" gap={1} paddingTop={1}>
        <ActionButton
          label={expanded() ? 'Hide temporary details' : 'Show temporary details'}
          hint={expanded() ? 'collapse' : 'expand'}
          onPress={() => setExpanded((current) => !current)}
        />
      </box>
      <Show when={expanded()}>
        <box
          flexDirection={hasWideLayout(dimensions().width) ? 'row' : 'column'}
          gap={2}
          alignItems="flex-start"
          width="100%"
        >
          <box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
            <OverviewConfiguration config={props.config} />
          </box>
          <box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
            <Limitations />
          </box>
        </box>
      </Show>
    </Section>
  );
};
