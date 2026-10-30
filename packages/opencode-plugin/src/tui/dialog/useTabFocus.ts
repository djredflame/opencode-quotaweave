/**
 * Focus ownership for an individually focusable tab bar.
 */

import type { BoxRenderable } from '@opentui/core';
import { createSignal, type Accessor } from 'solid-js';

export interface TabFocus {
  readonly focusedId: Accessor<string | null>;
  readonly register: (id: string, element: BoxRenderable | undefined) => void;
  readonly focusTab: (id: string) => void;
  readonly handleFocusChange: (id: string, focused: boolean) => void;
  readonly handleSelect: (id: string) => void;
}

/** Track focus and selection for one tab bar. */
export function useTabFocus(onChange: (id: string) => void): TabFocus {
  const [focusedId, setFocusedId] = createSignal<string | null>(null);
  const refs = new Map<string, BoxRenderable>();

  const register = (id: string, element: BoxRenderable | undefined) => {
    if (!element) {
      refs.delete(id);
      return;
    }
    refs.set(id, element);
  };

  const focusTab = (id: string) => {
    const element = refs.get(id);
    if (!element) return;
    element.focus();
    setFocusedId(id);
  };

  const handleFocusChange = (id: string, focused: boolean) => {
    if (focused) {
      setFocusedId(id);
      return;
    }
    setFocusedId((current) => (current === id ? null : current));
  };

  const handleSelect = (id: string) => {
    focusTab(id);
    onChange(id);
  };

  return { focusedId, register, focusTab, handleFocusChange, handleSelect };
}
