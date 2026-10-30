/**
 * Noninteractive placeholder for a planned main navigation destination.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { Section } from '../dialog/Primitives.js';

interface PlaceholderViewProps {
  readonly title: string;
  readonly description: string;
}

export const PlaceholderView: Component<PlaceholderViewProps> = (props) => {
  const context = usePlugin();

  return (
    <box flexDirection="column" flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
      <Section title={props.title.toUpperCase()}>
        <text fg={context.theme.text.base} wrapMode="word">
          {props.description}
        </text>
        <box flexDirection="column" gap={0} paddingTop={1}>
          <text fg={context.theme.text.feedback.warning.base} attributes={1} wrapMode="word">
            Detailed view not implemented yet
          </text>
          <text fg={context.theme.text.faint} wrapMode="word">
            This destination is reserved for a future QuotaWeave release.
          </text>
        </box>
      </Section>
    </box>
  );
};
