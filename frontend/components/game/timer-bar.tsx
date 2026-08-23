'use client';

import { useEffect, useRef } from 'react';
import { Clock } from 'pixelarticons/react';
import { ProgressBar } from '@heroui/react';
import { sfx } from '../../lib/sound';

interface TimerBarProps {
  remaining: number;
  total: number;
}

export function TimerBar({ remaining, total }: TimerBarProps) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const lastRef = useRef(remaining);

  useEffect(() => {
    if (remaining !== lastRef.current) {
      lastRef.current = remaining;
      if (remaining > 0 && remaining <= 5) sfx.tick();
    }
  }, [remaining]);

  const timeClassName = remaining <= 10
    ? 'flex items-center gap-1 font-medium tabular-nums text-danger'
    : 'flex items-center gap-1 font-medium tabular-nums';

  return (
    <div className="flex items-center gap-3">
      <ProgressBar aria-label="Time remaining" value={pct} className="flex-1">
        <ProgressBar.Track>
          <ProgressBar.Fill className="bg-[var(--palette-secondary)]" />
        </ProgressBar.Track>
      </ProgressBar>
      <span className={timeClassName}>
        <Clock className="size-4" aria-hidden="true" />
        {remaining}s
      </span>
    </div>
  );
}
