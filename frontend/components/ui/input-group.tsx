import { InputGroup as HeroInputGroup } from '@heroui/react';
import { createUIComponent } from './base';

const InputGroupRoot = createUIComponent(HeroInputGroup, [
  'border',
  'border-[var(--palette-border-accent-soft)]',
  'bg-[var(--palette-surface-card)]',
  'shadow-sm',
  'transition-[border-color,box-shadow]',
  'duration-200',
  'hover:border-[var(--palette-border-accent)]',
  'focus-within:border-[var(--palette-green-600)]',
  'focus-within:outline-none',
  'focus-within:ring-0',
  'focus-visible:border-[var(--palette-green-700)]',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[var(--palette-border-accent-soft)]',
  'focus-visible:ring-offset-2',
]);

const InputGroupInput = createUIComponent(HeroInputGroup.Input, [
  'text-[var(--palette-text-primary)]',
  'caret-[var(--palette-green-700)]',
  'placeholder:text-[var(--palette-text-muted)]',
]);

export const InputGroup = Object.assign(InputGroupRoot, {
  Input: InputGroupInput,
  Prefix: HeroInputGroup.Prefix,
  Suffix: HeroInputGroup.Suffix,
});
