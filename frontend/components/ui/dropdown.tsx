'use client';

import type { ComponentProps, Key } from 'react';
import { Dropdown as HeroDropdown } from '@heroui/react';
import { createUIComponent } from './base';

const Root = createUIComponent(HeroDropdown, []);
const Popover = createUIComponent(HeroDropdown.Popover, ['min-w-40']);
const Item = createUIComponent(HeroDropdown.Item, ['gap-2']);

type HeroMenuProps = ComponentProps<typeof HeroDropdown.Menu>;

interface MenuProps extends Omit<HeroMenuProps, 'selectedKeys' | 'onSelectionChange' | 'selectionMode'> {
  selectedKey?: string;
  onSelect?: (key: string) => void;
  selectionMode?: HeroMenuProps['selectionMode'];
}

function Menu({ selectedKey, onSelect, selectionMode, ...props }: MenuProps) {
  const single = selectedKey !== undefined || onSelect !== undefined;

  return (
    <HeroDropdown.Menu
      selectionMode={selectionMode ?? (single ? 'single' : undefined)}
      selectedKeys={selectedKey !== undefined ? [selectedKey] : undefined}
      onSelectionChange={
        onSelect
          ? (keys) => {
              const next = [...(keys as Iterable<Key>)][0];
              if (next !== undefined) onSelect(String(next));
            }
          : undefined
      }
      {...props}
    />
  );
}

export const Dropdown = Object.assign(Root, {
  Popover,
  Menu,
  Item,
  Section: HeroDropdown.Section,
  ItemIndicator: HeroDropdown.ItemIndicator,
  SubmenuTrigger: HeroDropdown.SubmenuTrigger,
  SubmenuIndicator: HeroDropdown.SubmenuIndicator,
});
