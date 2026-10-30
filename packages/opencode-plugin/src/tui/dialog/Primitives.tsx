/**
 * Flat, theme-driven content primitives for the QuotaWeave dialog.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { RGBA } from '@opentui/core';
import type { JSX } from '@opentui/solid';
import { createSignal, Show, type Component } from 'solid-js';

interface SectionProps {
  readonly title: string;
  readonly children: JSX.Element;
}

/** A compact titled group with no decorative container. */
export const Section: Component<SectionProps> = (props) => {
  const context = usePlugin();
  return (
    <box flexDirection="column" gap={0} paddingTop={1}>
      <text fg={context.theme.text.faint} attributes={1}>
        {props.title}
      </text>
      <box flexDirection="column" gap={0}>
        {props.children}
      </box>
    </box>
  );
};

interface RowProps {
  readonly label: string;
  readonly value: string;
  readonly detail?: string | undefined;
  readonly valueColor?: RGBA | undefined;
  readonly labelWidth?: number;
}

/** A label/value row that wraps long values without clipping. */
export const Row: Component<RowProps> = (props) => {
  const context = usePlugin();
  return (
    <box flexDirection="row" gap={2} alignItems="flex-start">
      <text fg={context.theme.text.muted} minWidth={props.labelWidth ?? 18} flexShrink={0}>
        {props.label}
      </text>
      <text fg={props.valueColor ?? context.theme.text.base} flexGrow={1} wrapMode="word">
        {props.value}
        {props.detail ? `  ${props.detail}` : ''}
      </text>
    </box>
  );
};

interface BadgeProps {
  readonly label: string;
  readonly color: RGBA;
}

/** Compact semantic status text. */
export const Badge: Component<BadgeProps> = (props) => {
  return (
    <text fg={props.color} attributes={1}>
      {props.label}
    </text>
  );
};

/** Compact capability or metadata tag. */
export const Tag: Component<{ readonly label: string }> = (props) => {
  const context = usePlugin();
  return (
    <box paddingLeft={1} paddingRight={1} backgroundColor={context.theme.background.raised.high}>
      <text fg={context.theme.text.action.primary.base}>{props.label}</text>
    </box>
  );
};

interface DisclosureProps {
  readonly title: string;
  readonly children: JSX.Element;
  readonly defaultOpen?: boolean;
}

/** Expandable/collapsible section for progressive disclosure. */
export const Disclosure: Component<DisclosureProps> = (props) => {
  const context = usePlugin();
  const [open, setOpen] = createSignal(props.defaultOpen ?? false);

  return (
    <box flexDirection="column" gap={0}>
      <box
        flexDirection="row"
        gap={1}
        alignItems="center"
        paddingTop={1}
        paddingBottom={1}
        onMouseDown={() => setOpen((o) => !o)}
        onMouseUp={() => {}}
      >
        <text fg={context.theme.text.faint} attributes={1} flexShrink={0}>
          {open() ? 'v' : '>'}
        </text>
        <text fg={context.theme.text.faint} attributes={1} flexShrink={0}>
          {props.title}
        </text>
      </box>
      <Show when={open()}>
        <box flexDirection="column" gap={0} paddingLeft={2}>
          {props.children}
        </box>
      </Show>
    </box>
  );
};

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly color?: RGBA | undefined;
}

/** Compact metric card that does not stretch across the dialog. */
export const MetricCard: Component<MetricCardProps> = (props) => {
  const context = usePlugin();
  return (
    <box
      flexDirection="column"
      minWidth={17}
      flexShrink={0}
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={context.theme.background.raised.base}
    >
      <text fg={props.color ?? context.theme.text.base} attributes={1}>
        {props.value}
      </text>
      <text fg={context.theme.text.faint}>{props.label}</text>
    </box>
  );
};

interface ChoiceChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly onSelect: () => void;
}

/** Clickable filter chip with an unmistakable active state. */
export const ChoiceChip: Component<ChoiceChipProps> = (props) => {
  const context = usePlugin();
  const [hovered, setHovered] = createSignal(false);
  const background = () => {
    if (props.active) return context.theme.background.action.primary.selected;
    if (hovered()) return context.theme.background.action.primary.hovered;
    return context.theme.background.raised.base;
  };
  const color = () => {
    if (props.active) return context.theme.text.action.primary.focused;
    if (hovered()) return context.theme.text.action.primary.hovered;
    return context.theme.text.muted;
  };
  let pressed = false;
  const trigger = () => {
    if (pressed) return;
    pressed = true;
    props.onSelect();
    setTimeout(() => {
      pressed = false;
    }, 0);
  };

  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={background()}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseDown={trigger}
      onMouseUp={trigger}
    >
      <text fg={color()} attributes={props.active ? 1 : 0}>
        {props.label}
      </text>
    </box>
  );
};
