'use client';

import { Trophy } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';

export function Scoreboard({ state, teamScores }) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
      <h2><Trophy className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('scoreboard')}</h2>
      {teamScores ? (
        <div className="flex justify-center gap-3 py-2 text-lg">
          <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">
            {t('teamA')} {teamScores[0]}
          </span>
          <span className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-muted">
            {t('teamB')} {teamScores[1]}
          </span>
        </div>
      ) : (
        <ul className="space-y-2">
          {[...state.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <li key={i}>
                <span>{p.nickname}</span>
                <b>
                  {p.score} {t('points')}
                </b>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default Scoreboard;
