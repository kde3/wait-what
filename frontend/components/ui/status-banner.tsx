'use client';

import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { Spinner } from './spinner';

export function StatusBanner({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        'flex flex-wrap items-center justify-center gap-2 rounded-lg border bg-surface-secondary px-3 py-2 text-sm text-muted',
        className,
      )}
      {...props}
    >
      <Spinner className="size-3" aria-hidden="true" />
      {children}
    </div>
  );
}
