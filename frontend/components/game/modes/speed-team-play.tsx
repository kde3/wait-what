'use client';

import { Hourglass, Key, PartyPopper, Zap } from 'pixelarticons/react';
import { useI18n } from '../../i18n-provider';
import { wordText } from '../../../lib/words';
import { sfx } from '../../../lib/sound';
import { useCountdown } from '../../../hooks/use-countdown';
import { useDraft } from '../../../hooks/use-draft';
import { useGenerate } from '../../../hooks/use-generate';
import { PromptPanel } from '../prompt-panel';
import { GuessPanel } from '../guess-panel';
import { TeamBadge } from '../team-badge';
import { TimerBar } from '../timer-bar';
import { Spinner } from '../../ui/spinner';
import { apiUrl } from '../../../lib/backend-url';
// ── 스피드 퀴즈 팀전 ─────────────────────────────────────

export function SpeedTeamPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, `${g.round}`);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}:${g.phase}`);
  const totalSecs = g.phase === 'play' ? state.options.speedSeconds : 6;
  const myTeam = g.yourTeam;
  const mine = g.teams[myTeam];
  const other = g.teams[1 - myTeam];

  async function onGuess(text) {
    const data = await api('guess', { playerId, text });
    if (data) (data.correct ? sfx.correct : sfx.wrong)();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          {g.round} / {g.total} {t('round')}
        </span>
        <span className="flex gap-2">
          <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">{t('teamA')} {g.teamScores[0]}</span>
          <span className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-muted">{t('teamB')} {g.teamScores[1]}</span>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.phase === 'reveal' ? (
        <div className="rounded-xl border bg-surface p-6 text-center text-foreground shadow-sm">
          <h2>
            {g.winnerTeam != null
              ? <><PartyPopper className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {`${t('winnerTeamLabel')}: ${g.winnerTeam === 0 ? t('teamA') : t('teamB')} (${g.winner})`}</>
              : t('noWinner')}
          </h2>
          <p className="my-2 text-sm">
            {t('keywordWas')}: <b>{wordText(g.keyword, lang)}</b>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((ti) =>
              g.teams[ti].image ? (
                <div key={ti} className="space-y-2 text-center">
                  <TeamBadge team={ti} />
                  <img className="w-full rounded-lg border object-cover" src={apiUrl(g.teams[ti].image)} alt="AI" />
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2>
              <TeamBadge team={myTeam} /> {t('yourTeam')}
            </h2>
            <span className="text-xs text-muted">
              {t('speedDrawerIs')}: <b>{mine.drawer}</b> · {other.imageReady ? <Zap className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : <Hourglass className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" />} {g.teams[1 - myTeam].drawer}
            </span>
          </div>

          {g.youAreDrawer ? (
            <>
              <div className="inline-flex rounded-full bg-surface-tertiary px-4 py-2 font-semibold text-foreground"><Key className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {wordText(g.keyword, lang)}</div>
              {mine.imageReady ? (
                <>
                  <img className="w-full select-none rounded-lg border object-cover" src={apiUrl(mine.image)} alt="AI" draggable={false} />
                  <GuessPanel guesses={g.guesses} disabled busy={busy} />
                </>
              ) : (
                <PromptPanel
                  prompt={prompt}
                  setPrompt={setPrompt}
                  imageUrl={imageUrl}
                  generating={generating}
                  busy={busy}
                  onGenerate={() => generate(prompt)}
                  onCancelGenerate={cancelGenerate}
                />
              )}
            </>
          ) : mine.imageReady ? (
            <>
              <img className="w-full select-none rounded-lg border object-cover" src={apiUrl(mine.image)} alt="AI" draggable={false} />
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          ) : (
            <>
              <div className="py-8 text-center text-sm text-muted">
                <Spinner className="mx-auto mb-3 block" aria-hidden="true" />
                {t('teamImageWaiting')}
              </div>
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      )}
    </>
  );
}

export default SpeedTeamPlay;
