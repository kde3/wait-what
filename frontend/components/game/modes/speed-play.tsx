'use client';

import { Key, PartyPopper } from 'pixelarticons/react';
import { useI18n } from '../../i18n-provider';
import { wordText } from '../../../lib/words';
import { sfx } from '../../../lib/sound';
import { useCountdown } from '../../../hooks/use-countdown';
import { useDraft } from '../../../hooks/use-draft';
import { useGenerate } from '../../../hooks/use-generate';
import { PromptPanel } from '../prompt-panel';
import { GuessPanel } from '../guess-panel';
import { Scoreboard } from '../scoreboard';
import { TimerBar } from '../timer-bar';
import { Spinner } from '../../ui/spinner';
import { apiUrl } from '../../../lib/backend-url';
// ── 스피드 퀴즈 ──────────────────────────────────────────

export function SpeedPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, `${g.round}`);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}:${g.phase}`);
  const totalSecs =
    g.phase === 'draw' ? state.options.imageSeconds : g.phase === 'guess' ? state.options.textSeconds : 6;

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
        <span className="text-xs text-muted">
          {t('speedDrawerIs')}: <b>{g.drawer}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.phase === 'reveal' ? (
        <div className="rounded-xl border bg-surface p-6 text-center text-foreground shadow-sm">
          <h2>{g.winner ? <><PartyPopper className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {`${t('roundWinner')}: ${g.winner}`}</> : t('noWinner')}</h2>
          <p className="my-2 text-sm">
            {t('keywordWas')}: <b>{wordText(g.keyword, lang)}</b>
          </p>
          {g.image && <img className="w-full rounded-lg border object-cover" src={apiUrl(g.image)} alt="AI" />}
        </div>
      ) : g.youAreDrawer ? (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          <h2>{t('speedDrawTitle')}</h2>
          <div className="inline-flex rounded-full bg-surface-tertiary px-4 py-2 font-semibold text-foreground"><Key className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {wordText(g.keyword, lang)}</div>
          {g.phase === 'draw' ? (
            <PromptPanel
              prompt={prompt}
              setPrompt={setPrompt}
              imageUrl={imageUrl}
              generating={generating}
              busy={busy}
              onGenerate={() => generate(prompt)}
              onCancelGenerate={cancelGenerate}
              onSubmit={async () => {
                if (await api('submit', { playerId })) sfx.submit();
              }}
            />
          ) : (
            <>
              {g.image && <img className="w-full select-none rounded-lg border object-cover" src={apiUrl(g.image)} alt="AI" draggable={false} />}
              <GuessPanel guesses={g.guesses} disabled busy={busy} />
            </>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      ) : (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          {g.phase === 'draw' ? (
            g.liveImage ? (
              <img className="w-full rounded-lg border object-cover" src={apiUrl(g.liveImage)} alt="AI" />
            ) : (
              <div className="py-8 text-center text-sm text-muted">
                <Spinner className="mx-auto mb-3 block" aria-hidden="true" />
                {t('speedWaitingDrawer')}
              </div>
            )
          ) : (
            <>
              <h2>{t('speedGuessTitle')}</h2>
              {g.image && <img className="w-full select-none rounded-lg border object-cover" src={apiUrl(g.image)} alt="AI" draggable={false} />}
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      )}

      <Scoreboard state={state} teamScores={g.teamMode ? g.teamScores : null} />
    </>
  );
}

export default SpeedPlay;
