'use client';

import { Button as HeroButton } from '@heroui/react';
import { createUIComponent } from './base';

const shared = [
  'font-medium',
  'transition-[background-color,filter,box-shadow]',
  'duration-200',
  'pressed:brightness-95',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
  'disabled:shadow-none',
];

export const Button = createUIComponent(HeroButton, shared);

export const SoftButton = createUIComponent(HeroButton, [
  ...shared,
  '[--button-bg:var(--palette-control-surface)]',
  '[--button-bg-hover:var(--palette-control-hover)]',
  '[--button-bg-pressed:var(--palette-control-pressed)]',
  '[--button-fg:var(--palette-primary-strong)]',
]);
