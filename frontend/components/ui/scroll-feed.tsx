'use client';

import type { HTMLAttributes } from 'react';
import { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface ScrollFeedProps extends HTMLAttributes<HTMLDivElement> {
  bottomKey?: unknown;
}

export function ScrollFeed({ bottomKey, className, children, ...props }: ScrollFeedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [bottomKey]);

  return (
    <div
      ref={ref}
      className={twMerge('max-h-40 space-y-1 overflow-y-auto rounded-lg bg-surface-secondary p-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default ScrollFeed;
