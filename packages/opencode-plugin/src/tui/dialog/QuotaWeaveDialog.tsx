/**
 * Root QuotaWeave dialog content.
 *
 * A single host-managed dialog hosts all main navigation destinations. The
 * host owns Escape, backdrop dismissal, focus restoration, and the modal key
 * scope; this component owns only view state.
 */

import type { Component } from 'solid-js';
import type { QuotaWeaveDialogProps } from '../types.js';
import { DialogLayout } from './DialogLayout.js';
import { useDialogState } from './useDialogState.js';

export const QuotaWeaveDialog: Component<QuotaWeaveDialogProps> = (props) => {
  const state = useDialogState(props);

  return <DialogLayout session={props.session} state={state} />;
};
