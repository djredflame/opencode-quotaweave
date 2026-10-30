/**
 * Bounded, theme-aware scroll region for the active content workspace.
 *
 * The region fills the height its parent assigns and never grows to its
 * content. It is focusable so keyboard scrolling follows focus while mouse
 * wheel scrolling stays local to the hovered region.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { ScrollBoxRenderable } from '@opentui/core';
import type { JSX } from '@opentui/solid';
import { onCleanup, onMount, createEffect, type Component } from 'solid-js';

interface ScrollRegionProps {
  readonly children: JSX.Element;
  readonly autofocus?: boolean;
  readonly initialScrollTop?: number;
  readonly onScrollPositionChange?: (scrollTop: number) => void;
  readonly onReady?: (element: ScrollBoxRenderable | undefined) => void;
}

function updateScrollbarVisibility(element: ScrollBoxRenderable | undefined): void {
  if (!element || element.isDestroyed) return;
  const scrollBar = element.verticalScrollBar;
  if (!scrollBar) return;
  const contentHeight = element.scrollHeight;
  const viewportHeight = scrollBar.viewportSize;
  scrollBar.visible = contentHeight > viewportHeight;
}

export const ScrollRegion: Component<ScrollRegionProps> = (props) => {
  const context = usePlugin();
  let element: ScrollBoxRenderable | undefined;

  onMount(() => {
    const initial = props.initialScrollTop ?? 0;
    if (!props.autofocus && initial <= 0) return;
    setTimeout(() => {
      if (!element || element.isDestroyed) return;
      if (initial > 0) element.scrollTop = initial;
      if (props.autofocus) element.focus();
    }, 1);
  });

  onCleanup(() => {
    if (!element || element.isDestroyed) return;
    props.onScrollPositionChange?.(element.scrollTop);
  });

  createEffect(() => updateScrollbarVisibility(element));

  return (
    <scrollbox
      ref={(value) => {
        element = value ?? undefined;
        props.onReady?.(element);
      }}
      focusable={true}
      flexGrow={1}
      flexBasis={0}
      minHeight={0}
      width="100%"
      shouldFill={true}
      onMouseDown={() => element?.focus()}
      scrollY={true}
      scrollX={false}
      verticalScrollbarOptions={{
        trackOptions: {
          backgroundColor: context.theme.background.raised.base,
          foregroundColor: context.theme.scrollbar.base,
        },
      }}
      horizontalScrollbarOptions={{ visible: false }}
      contentOptions={{ padding: 0, gap: 0 }}
    >
      {props.children}
    </scrollbox>
  );
};
