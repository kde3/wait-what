'use client';

import { createUIComponent } from './base';

export const Spinner = createUIComponent('span', [
  'inline-block',
  'size-6',
  'shrink-0',
  'animate-spin',
  'rounded-full',
  'border-2',
  'border-muted',
  'border-t-primary',
]);
