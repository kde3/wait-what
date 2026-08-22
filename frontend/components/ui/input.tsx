import { Input as HeroInput } from '@heroui/react';
import { createUIComponent } from './base';

export const Input = createUIComponent(HeroInput, [
  'border',
  'border-[var(--palette-border-accent-soft)]',
  'bg-[var(--palette-surface-card)]',
  'font-medium',
  'text-[var(--palette-text-primary)]',
  'caret-[var(--palette-green-700)]',
  'placeholder:text-[var(--palette-text-muted)]',
  'shadow-sm',
  'transition-[border-color,box-shadow]',
  'duration-200',
  'hover:border-[var(--palette-border-accent)]',
  'focus:border-[var(--palette-green-600)]',
  'focus:outline-none',
  'focus:ring-0',
  'focus-visible:border-[var(--palette-green-700)]',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[var(--palette-border-accent-soft)]',
  'focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
]);
