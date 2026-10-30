/**
 * Native-style clickable text action for the QuotaWeave dialog.
 */

import { usePlugin } from '@opencode/plugin/tui';
import { createSignal, type Component } from 'solid-js';

interface DialogActionProps {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly onTrigger: () => void;
}

export const DialogAction: Component<DialogActionProps> = (props) => {
  const context = usePlugin();
  const [hovered, setHovered] = createSignal(false);
  const color = () =>
    hovered() ? context.theme.text.action.primary.hovered : context.theme.text.base;

  return (
    <box
      flexDirection="row"
      gap={1}
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={
        hovered()
          ? context.theme.background.action.primary.hovered
          : context.theme.background.raised.base
      }
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseUp={props.onTrigger}
    >
      <text fg={color()}>{props.label}</text>
      {props.hint ? <text fg={context.theme.text.faint}>{props.hint}</text> : null}
    </box>
  );
};
