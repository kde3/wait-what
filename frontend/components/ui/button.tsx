'use client';

import { Button as HeroButton } from '@heroui/react';
import { createUIComponent } from './base';

export const Button = createUIComponent(HeroButton, [
  'primary-gradient',
  'font-medium',
  'text-white',
  'transition-[filter,box-shadow]',
  'duration-200',
  'hover:brightness-105',
  'pressed:brightness-95',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[var(--palette-border-accent)]',
  'focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
  'disabled:shadow-none',
]);
