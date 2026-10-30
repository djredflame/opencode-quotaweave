/**
 * Search and status/category filters for the Model Explorer.
 */

import type { InputRenderable } from '@opentui/core';
import type { ResolvedRoutingConfig } from '@opencode-quotaweave/core';
import { usePlugin } from '@opencode/plugin/tui';
import { type Accessor, type Component } from 'solid-js';
import { CATEGORY_SHORT_LABELS, isCategoryFilter, isStatusFilter } from '../state.js';
import { ROUTING_CATEGORY_IDS, PREDEFINED_CATEGORIES } from '../routing-data.js';
import type { ModelFilterState, ModelStatusFilter } from '../types.js';

interface ModelFiltersProps {
  readonly config: ResolvedRoutingConfig;
  readonly filter: Accessor<ModelFilterState>;
  readonly count: number;
  readonly onFilterChange: (patch: Partial<ModelFilterState>) => void;
}

const STATUS_OPTIONS: readonly { id: ModelStatusFilter; label: string; description: string }[] = [
  { id: 'all', label: 'All', description: 'All models' },
  { id: 'enabled', label: 'Enabled', description: 'Only enabled models' },
  { id: 'disabled', label: 'Disabled', description: 'Only disabled models' },
];

function categoryButtonOptions(
  config: ResolvedRoutingConfig,
): { id: string; label: string; description: string }[] {
  return [
    { id: 'all', label: 'All', description: 'All categories' },
    ...ROUTING_CATEGORY_IDS.map((id) => {
      const configured = config.categories.find((c) => c.id === id);
      const label = CATEGORY_SHORT_LABELS[id] ?? id;
      const count = configured ? configured.modelIds.length : 0;
      const predefined = PREDEFINED_CATEGORIES[id];
      const description = configured
        ? (configured.description ?? predefined?.description ?? '')
        : (predefined?.description ?? 'Not configured in active routing');
      return { id, label, description: `${count} models${description ? ` — ${description}` : ''}` };
    }),
  ];
}

function SearchInput(props: { readonly onChange: (query: string) => void }) {
  const context = usePlugin();
  let inputRef: InputRenderable | undefined;

  return (
    <input
      ref={(el) => {
        inputRef = el ?? undefined;
      }}
      onMouseDown={() => inputRef?.focus()}
      // Uncontrolled input pattern: don't bind value, only initial value
      // Native InputRenderable emits 'input' event on every change
      // Controlled value prop breaks cursor position (resets to EOL on every keystroke)
      onInput={(value) => props.onChange(value)}
      onChange={(value) => props.onChange(value)}
      placeholder="Search by model, provider, name, or capability"
      backgroundColor={context.theme.background.formfield.base}
      focusedBackgroundColor={context.theme.background.formfield.focused}
      textColor={context.theme.text.formfield.base}
      focusedTextColor={context.theme.text.formfield.focused}
      cursorColor={context.theme.text.base}
      placeholderColor={context.theme.text.faint}
      width="100%"
    />
  );
}

interface FilterButtonGroupProps {
  readonly label: string;
  readonly options: readonly { id: string; label: string; description: string }[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

function FilterButtonGroup(props: FilterButtonGroupProps) {
  const context = usePlugin();

  return (
    <box flexDirection="column" gap={0} flexShrink={0}>
      <text fg={context.theme.text.faint} flexShrink={0} paddingBottom={0}>
        {props.label}
      </text>
      <box flexDirection="row" flexWrap="wrap" gap={1} minWidth={0}>
        {props.options.map((option) => (
          <FilterButton
            option={option}
            active={option.id === props.activeId}
            onSelect={props.onSelect}
          />
        ))}
      </box>
    </box>
  );
}

interface FilterButtonProps {
  readonly option: { id: string; label: string; description: string };
  readonly active: boolean;
  readonly onSelect: (id: string) => void;
}

function FilterButton(props: FilterButtonProps) {
  const context = usePlugin();

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

  return (
    <box
      focusable={true}
      flexShrink={0}
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={backgroundColor()}
      borderColor={borderColor()}
      border={['bottom']}
      onMouseDown={() => props.onSelect(props.option.id)}
      onMouseUp={() => props.onSelect(props.option.id)}
      onKeyDown={(e) => {
        if (e.name === 'Enter' || e.name === ' ') {
          e.preventDefault();
          props.onSelect(props.option.id);
        }
      }}
    >
      <text fg={textColor()} attributes={props.active ? 1 : 0}>
        {props.option.label}
      </text>
    </box>
  );
}

function StatusFilterBar(props: {
  readonly filter: Accessor<ModelFilterState>;
  readonly onFilterChange: (patch: Partial<ModelFilterState>) => void;
}) {
  const handleStatusSelect = (id: string) => {
    if (isStatusFilter(id)) {
      props.onFilterChange({ statusFilter: id });
    }
  };

  return (
    <FilterButtonGroup
      label="STATUS"
      options={STATUS_OPTIONS}
      activeId={props.filter().statusFilter}
      onSelect={handleStatusSelect}
    />
  );
}

function CategoryFilterBar(props: {
  readonly filter: Accessor<ModelFilterState>;
  readonly config: ResolvedRoutingConfig;
  readonly onFilterChange: (patch: Partial<ModelFilterState>) => void;
}) {
  const options = categoryButtonOptions(props.config);

  const handleCategorySelect = (id: string) => {
    if (isCategoryFilter(id, props.config)) {
      props.onFilterChange({ categoryFilter: id });
    }
  };

  return (
    <FilterButtonGroup
      label="CATEGORY"
      options={options}
      activeId={props.filter().categoryFilter}
      onSelect={handleCategorySelect}
    />
  );
}

export const ModelFilters: Component<ModelFiltersProps> = (props) => {
  return (
    <box flexDirection="column" gap={1} flexShrink={0}>
      <SearchInput onChange={(q) => props.onFilterChange({ searchQuery: q })} />
      <box flexDirection="column" gap={1} flexShrink={0}>
        <StatusFilterBar filter={props.filter} onFilterChange={props.onFilterChange} />
        <CategoryFilterBar
          filter={props.filter}
          config={props.config}
          onFilterChange={props.onFilterChange}
        />
      </box>
      <text fg={usePlugin().theme.text.faint} flexShrink={0}>
        {props.count} / {props.config.models.length}
      </text>
    </box>
  );
};
