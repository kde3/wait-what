'use client';

import type { ComponentProps, ReactNode } from 'react';
import { ListBox, Select as HeroSelect } from '@heroui/react';
import { createUIComponent } from './base';

const Root = createUIComponent(HeroSelect, []);
const Trigger = createUIComponent(HeroSelect.Trigger, []);
const Value = createUIComponent(HeroSelect.Value, []);
const Popover = createUIComponent(HeroSelect.Popover, ['min-w-40']);
const Item = createUIComponent(ListBox.Item, ['gap-2']);

function Options({ children, ...props }: ComponentProps<typeof HeroSelect.Popover>) {
  return (
    <Popover {...props}>
      <ListBox>{children}</ListBox>
    </Popover>
  );
}

interface FieldProps extends Omit<ComponentProps<typeof Root>, 'children'> {
  children: ReactNode;
}

function Field({ children, placeholder, ...props }: FieldProps) {
  return (
    <Root {...props}>
      <Trigger>
        <Value>{placeholder}</Value>
      </Trigger>
      <Options>{children}</Options>
    </Root>
  );
}

export const Select = Object.assign(Field, {
  Root,
  Trigger,
  Value,
  Popover,
  Options,
  Item,
  ItemIndicator: ListBox.ItemIndicator,
  Section: ListBox.Section,
  Indicator: HeroSelect.Indicator,
});
