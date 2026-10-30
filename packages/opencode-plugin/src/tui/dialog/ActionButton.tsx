/**
 * Clickable action used for dashboard shortcuts and form actions.
 */

import { usePlugin } from '@opencode/plugin/tui';
import { createSignal, type Component } from 'solid-js';

interface ActionButtonProps {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly onPress: () => void;
}

export const ActionButton: Component<ActionButtonProps> = (props) => {
  const context = usePlugin();
  const [hovered, setHovered] = createSignal(false);
  const background = () => {
    if (hovered()) return context.theme.background.action.primary.hovered;
    return context.theme.background.raised.high;
  };
  const color = () => {
    if (hovered()) return context.theme.text.action.primary.hovered;
    return context.theme.text.action.primary.base;
  };
  let pressed = false;
  const trigger = () => {
    if (pressed) return;
    pressed = true;
    props.onPress();
    setTimeout(() => {
      pressed = false;
    }, 0);
  };

  return (
    <box
      height={1}
      flexDirection="row"
      gap={1}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
      backgroundColor={background()}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseDown={trigger}
      onMouseUp={trigger}
    >
      <text fg={color()}>{props.label}</text>
      {props.hint ? <text fg={context.theme.text.faint}>{props.hint}</text> : null}
    </box>
  );
};
