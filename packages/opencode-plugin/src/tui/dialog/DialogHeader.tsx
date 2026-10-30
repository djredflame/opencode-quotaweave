/**
 * Compact dialog header with active configuration and native-style actions.
 */

import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import type { Component } from 'solid-js';
import { strategyLabel } from '../format.js';
import type { QuotaWeaveView } from '../types.js';
import { QUOTAWEAVE_VERSION } from '../types.js';
import { DialogAction } from './DialogAction.js';

interface DialogHeaderProps {
  readonly view: QuotaWeaveView;
  readonly config: ResolvedRoutingConfig;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

function statusLine(config: ResolvedRoutingConfig): string {
  const enabled = config.models.filter((model) => model.enabled).length;
  const policy = config.costPolicy.freeOnly ? 'Free-only' : 'Paid allowed';
  return `${config.models.length} models · ${enabled} enabled · ${policy} · ${strategyLabel(config.defaultStrategy)}`;
}

export const DialogHeader: Component<DialogHeaderProps> = (props) => {
  const context = usePlugin();
  const atRoot = () => props.view === 'overview';

  return (
    <box flexDirection="column" gap={0} flexShrink={0}>
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <box flexDirection="row" gap={2} alignItems="center" flexShrink={0}>
          <text fg={context.theme.text.base} attributes={1}>
            QuotaWeave
          </text>
          <text fg={context.theme.text.faint}>v{QUOTAWEAVE_VERSION}</text>
        </box>
        <box flexDirection="row" gap={1} alignItems="center" flexShrink={0}>
          {atRoot() ? null : <DialogAction label="Back" onTrigger={props.onBack} />}
          <DialogAction label="Close" hint="esc" onTrigger={props.onClose} />
        </box>
      </box>
      <text fg={context.theme.text.faint} wrapMode="word" overflow="hidden">
        {statusLine(props.config)}
      </text>
    </box>
  );
};
