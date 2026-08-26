'use client';

import { Check, Eye } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import { Button } from '../ui/button';
import { StatusBanner } from '../ui/status-banner';

export interface ImposterCandidate {
  nickname: string;
  left?: boolean;
  you?: boolean;
}

interface ImposterVotePanelProps {
  candidates: ImposterCandidate[];
  yourVote?: number | null;
  votedCount?: number;
  voterTotal?: number;
  busy?: boolean;
  onVote: (index: number) => void;
}

export function ImposterVotePanel({
  candidates,
  yourVote = null,
  votedCount = 0,
  voterTotal = 0,
  busy = false,
  onVote,
}: ImposterVotePanelProps) {
  const { t } = useI18n();
  const voted = yourVote !== null && yourVote !== undefined;

  return (
    <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
      <h2>
        <Eye className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('imposterVoteTitle')}
      </h2>
      <p className="text-sm text-muted">{t('imposterVoteHint')}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {candidates.map((c, i) => (
          <Button
            key={i}
            variant={yourVote === i ? 'primary' : 'outline'}
            className="h-auto min-h-12 w-full justify-start gap-2 whitespace-normal p-3 text-left"
            isDisabled={busy || voted || !!c.you || !!c.left}
            onClick={() => onVote(i)}
          >
            {yourVote === i && <Check className="size-4 shrink-0" aria-hidden="true" />}
            <span className="min-w-0 break-words">
              {c.nickname}
              {c.you && ` (${t('you')})`}
              {c.left && ` ${t('imposterVoteLeft')}`}
            </span>
          </Button>
        ))}
      </div>
      {voted ? (
        <StatusBanner className="mt-3">
          {t('imposterVoteWait')} ({votedCount}/{voterTotal})
        </StatusBanner>
      ) : (
        <p className="mt-3 text-center text-sm text-muted">
          {t('imposterVotePick')} ({votedCount}/{voterTotal})
        </p>
      )}
    </div>
  );
}

export default ImposterVotePanel;
