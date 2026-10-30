/**
 * Routing Inspector task entry.
 */

import type { InputRenderable } from '@opentui/core';
import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { For, type Component, createEffect } from 'solid-js';
import { ActionButton } from '../../dialog/ActionButton.js';
import { ChoiceChip, Row, Section } from '../../dialog/Primitives.js';
import { strategyLabel } from '../../format.js';
import { ScrollRegion } from '../ScrollRegion.js';
import { isRunnableTask } from '../../state.js';

interface SimulationInputViewProps {
  readonly config: ResolvedRoutingConfig;
  readonly task: string;
  readonly initialScrollTop: number;
  readonly onScrollPositionChange: (scrollTop: number) => void;
  readonly onTaskChange: (task: string) => void;
  readonly onRun: () => void;
}

const EXAMPLES: readonly string[] = [
  'Debug this memory leak in Node.js',
  'Review this pull request for security issues',
  'Create unit tests for the auth module',
  'Document the public API endpoints',
];

const TaskSection: Component<SimulationInputViewProps> = (props) => {
  const context = usePlugin();
  let inputRef: InputRenderable | undefined;

  const run = () => {
    if (isRunnableTask(props.task)) props.onRun();
  };

  // Sync native input value when task changes externally (e.g., example selection).
  // Only assign when the input's current value differs from props.task to avoid
  // interfering with user typing (uncontrolled input pattern).
  createEffect(() => {
    if (inputRef && inputRef.value !== props.task) {
      inputRef.value = props.task;
    }
  });

  return (
    <Section title="TASK">
      <box
        flexDirection="column"
        gap={1}
        padding={1}
        backgroundColor={context.theme.background.raised.base}
      >
        <input
          ref={(el) => {
            inputRef = el ?? undefined;
          }}
          onMouseDown={() => inputRef?.focus()}
          // Uncontrolled input pattern - do NOT use controlled 'value' prop
          // Controlled value prop breaks cursor position (resets to EOL on every keystroke)
          onInput={props.onTaskChange}
          onChange={props.onTaskChange}
          placeholder="Describe a task, for example: refactor this module to use async iterators"
          onSubmit={run}
          backgroundColor={context.theme.background.formfield.base}
          focusedBackgroundColor={context.theme.background.formfield.focused}
          textColor={context.theme.text.formfield.base}
          focusedTextColor={context.theme.text.formfield.focused}
          cursorColor={context.theme.text.base}
          placeholderColor={context.theme.text.faint}
        />
        <box flexDirection="row" flexWrap="wrap" gap={1} alignItems="center">
          <ActionButton label="Simulate" hint="enter" onPress={run} />
          <text fg={context.theme.text.faint}>Local only — no provider request or quota use.</text>
        </box>
      </box>
    </Section>
  );
};

const ExamplesSection: Component<SimulationInputViewProps> = (props) => {
  return (
    <Section title="EXAMPLES">
      <box flexDirection="column" gap={1}>
        <For each={EXAMPLES}>
          {(example) => (
            <ChoiceChip
              label={example}
              active={props.task === example}
              onSelect={() => props.onTaskChange(example)}
            />
          )}
        </For>
      </box>
    </Section>
  );
};

const ConfigSection: Component<Pick<SimulationInputViewProps, 'config'>> = (props) => {
  return (
    <Section title="ACTIVE CONFIGURATION">
      <box flexDirection="row" flexWrap="wrap" gap={2}>
        <box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
          <Row
            label="Models"
            value={`${props.config.models.filter((model) => model.enabled).length}/${props.config.models.length} enabled`}
            labelWidth={14}
          />
          <Row
            label="Categories"
            value={`${props.config.categories.filter((category) => category.enabled).length} enabled`}
            labelWidth={14}
          />
        </box>
        <box flexDirection="column" flexGrow={1} flexBasis={0} minWidth={0}>
          <Row
            label="Policy"
            value={props.config.costPolicy.freeOnly ? 'Free-only' : 'Paid allowed'}
            labelWidth={14}
          />
          <Row
            label="Strategy"
            value={strategyLabel(props.config.defaultStrategy)}
            labelWidth={14}
          />
        </box>
      </box>
    </Section>
  );
};

export const SimulationInputView: Component<SimulationInputViewProps> = (props) => {
  return (
    <box flexDirection="column" flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
      <box flexShrink={0}>
        <TaskSection {...props} />
      </box>
      <ScrollRegion
        initialScrollTop={props.initialScrollTop}
        onScrollPositionChange={props.onScrollPositionChange}
      >
        <ExamplesSection {...props} />
        <ConfigSection config={props.config} />
      </ScrollRegion>
    </box>
  );
};
