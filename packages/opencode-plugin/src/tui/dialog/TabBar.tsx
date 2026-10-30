/**
 * Mouse- and keyboard-accessible tab bar.
 *
 * Every tab is individually focusable, so Tab / Shift+Tab use the host focus
 * traversal. Enter or Space activates the focused tab, and Left/Right move focus
 * inside the bar. Escape is never bound here.
 *
 * Visual styling matches the FilterButton component used in ModelFilters.tsx
 * for the Status/Category filter buttons.
 */

import { usePlugin } from '@opencode/plugin/tui';
import type { BoxRenderable } from '@opentui/core';
import { For, type Component } from 'solid-js';
import type { NavigationDensity } from '../state.js';
import { useTabFocus } from './useTabFocus.js';
import { useTabKeymap } from './useTabKeymap.js';

interface TabItem {
  readonly id: string;
  readonly label: string;
}

interface TabBarProps {
  readonly scope: string;
  readonly tabs: readonly TabItem[];
  readonly active: string;
  readonly density?: NavigationDensity;
  readonly onChange: (id: string) => void;
}

interface TabProps {
  readonly item: TabItem;
  readonly active: boolean;
  readonly focused: boolean;
  readonly compact: boolean;
  readonly onSelect: (id: string) => void;
  readonly onFocusChange: (id: string, focused: boolean) => void;
  readonly register: (id: string, element: BoxRenderable | undefined) => void;
  readonly tabOrder: number;
}

const Tab: Component<TabProps> = (props) => {
  const context = usePlugin();

  // Register with local focus manager only
  const ref = (value: BoxRenderable | undefined) => {
    props.register(props.item.id, value ?? undefined);
  };

  // Match FilterButton styling from ModelFilters.tsx
  const backgroundColor = () => {
    if (props.active) return context.theme.background.action.primary.selected;
    return context.theme.background.formfield.base;
  };
  const textColor = () => {
    if (props.active) return context.theme.text.action.primary.focused;
    return context.theme.text.formfield.base;
  };
  const borderColor = () => {
    if (props.active) return context.theme.background.action.primary.selected;
    return context.theme.background.formfield.base;
  };
  const select = () => props.onSelect(props.item.id);

  return (
    <box
      ref={ref}
      focusable={true}
      flexShrink={0}
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={backgroundColor()}
      borderColor={borderColor()}
      border={['bottom']}
      onMouseDown={select}
      onMouseUp={select}
      on:focused={() => props.onFocusChange(props.item.id, true)}
      on:blurred={() => props.onFocusChange(props.item.id, false)}
    >
      <text fg={textColor()} attributes={props.active ? 1 : 0}>
        {props.item.label}
      </text>
    </box>
  );
};

export const TabBar: Component<TabBarProps> = (props) => {
  const focus = useTabFocus(props.onChange);
  const compact = () => props.density === 'compact';

  useTabKeymap({
    scope: props.scope,
    tabs: props.tabs,
    active: props.active,
    focusedId: focus.focusedId,
    focusTab: focus.focusTab,
    onChange: props.onChange,
  });

  // Wrap tabs in a box that registers the tab bar as a focusable group
  // The individual Tab components will register themselves with the local focus manager
  return (
    <box flexDirection="row" flexWrap="wrap" gap={1} flexShrink={0}>
      <For each={props.tabs}>
        {(item) => (
          <Tab
            item={item}
            active={item.id === props.active}
            focused={focus.focusedId() === item.id}
            compact={compact()}
            onSelect={focus.handleSelect}
            onFocusChange={focus.handleFocusChange}
            register={focus.register}
            tabOrder={10 + props.tabs.findIndex((t) => t.id === item.id)}
          />
        )}
      </For>
    </box>
  );
};
