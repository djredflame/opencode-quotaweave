/**
 * Presentational shell for the QuotaWeave dialog contents.
 */

import { usePlugin } from '@opencode/plugin/tui';
import { useTerminalDimensions } from '@opentui/solid';
import { Show, createEffect, type Component } from 'solid-js';
import {
  resolveContentMaxWidth,
  resolveDialogSize,
  resolveNavigationDensity,
  resolveShellHeight,
} from '../state.js';
import { VIEW_TABS, isQuotaWeaveView } from '../tabs.js';
import type { QuotaWeaveSession } from '../types.js';
import { DialogHeader } from './DialogHeader.js';
import { footerHints } from './footer.js';
import { renderActiveView } from './render-view.js';
import { TabBar } from './TabBar.js';
import type { DialogState } from './useDialogState.js';

interface DialogLayoutProps {
  readonly session: QuotaWeaveSession;
  readonly state: DialogState;
}

function useDialogSize(
  context: ReturnType<typeof usePlugin>,
  dimensions: ReturnType<typeof useTerminalDimensions>,
): void {
  createEffect(() => {
    context.ui.dialog.set({ size: resolveDialogSize(dimensions().width), centered: true });
  });
}

interface DialogContentProps {
  readonly props: DialogLayoutProps;
  readonly context: ReturnType<typeof usePlugin>;
  readonly dimensions: ReturnType<typeof useTerminalDimensions>;
  readonly hasResult: () => boolean;
}

function renderDialogContent({ props, context, dimensions, hasResult }: DialogContentProps) {
  return (
    <box
      width="100%"
      maxWidth={resolveContentMaxWidth(dimensions().width)}
      height={resolveShellHeight(dimensions().height)}
      maxHeight="100%"
      flexDirection="column"
      gap={1}
      paddingLeft={2}
      paddingRight={2}
      paddingBottom={1}
      overflow="hidden"
      alignSelf="center"
    >
      <DialogHeader
        view={props.state.view()}
        config={props.session.config}
        onBack={props.state.back}
        onClose={props.state.close}
      />
      <TabBar
        scope="views"
        tabs={VIEW_TABS}
        active={props.state.view()}
        density={resolveNavigationDensity(dimensions().width)}
        onChange={(id: string) => {
          if (isQuotaWeaveView(id)) props.state.setView(id);
        }}
      />
      <box flexGrow={1} flexBasis={0} minHeight={0} overflow="hidden">
        <Show when={props.state.view()} keyed>
          {(view) => renderActiveView({ session: props.session, state: props.state, view })}
        </Show>
      </box>
      <text fg={context.theme.text.faint} wrapMode="none" overflow="hidden" flexShrink={0}>
        {footerHints(props.state.view(), hasResult())}
      </text>
    </box>
  );
}

export const DialogLayout: Component<DialogLayoutProps> = (props) => {
  const context = usePlugin();
  const dimensions = useTerminalDimensions();
  const hasResult = () => props.state.simulation().result !== null;

  useDialogSize(context, dimensions);

  return renderDialogContent({
    props,
    context,
    dimensions,
    hasResult,
  });
};
