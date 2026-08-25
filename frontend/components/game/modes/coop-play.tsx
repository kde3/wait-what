'use client';

import { Check, Hourglass, Target, Users } from 'pixelarticons/react';
import { useI18n } from '../../i18n-provider';
import { wordText } from '../../../lib/words';
import { sfx } from '../../../lib/sound';
import { useCountdown } from '../../../hooks/use-countdown';
import { useDraft } from '../../../hooks/use-draft';
import { useGenerate } from '../../../hooks/use-generate';
import { PromptPanel } from '../prompt-panel';
import { TeamBadge } from '../team-badge';
import { SubmittedNotice } from '../submitted-notice';
import { TimerBar } from '../timer-bar';
import { apiUrl } from '../../../lib/backend-url';
function cellSpan(group, index) {
  const remainder = group.cells.length % group.cols;
  if (!remainder || index < group.cells.length - remainder) return 1;
  return group.cols % remainder === 0 ? group.cols / remainder : 1;
}

export function CoopPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.you.draft, 'coop');
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, 'coop');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          <Target className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayThemeLabel')}: <b>{wordText(g.theme, lang)}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={state.options.imageSeconds} />

      {g.groups.map((group, gi) => (
        <div key={gi} className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          {g.teamMode && (
            <h2>
              <TeamBadge team={gi} />
            </h2>
          )}
          <div className="grid overflow-hidden rounded-lg border" style={{ gridTemplateColumns: `repeat(${group.cols}, 1fr)` }}>
            {group.cells.map((cell, ci) => (
              <div
                key={ci}
                style={{ gridColumn: `span ${cellSpan(group, ci)}`, aspectRatio: String(cellSpan(group, ci)) }}
                className={cell.you ? 'overflow-hidden border-2 border-accent' : 'overflow-hidden border'}
              >
                {cell.url ? (
                  <img src={apiUrl(cell.url)} alt={cell.nickname} />
                ) : (
                  <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">
                    <span>{cell.submitted ? <Check className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : <Hourglass className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" />}</span>
                    <span>{cell.nickname}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
        <h2><Users className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('coopTitle')}</h2>
        {g.you.submitted && (
          <div className="mb-3">
            <SubmittedNotice />
          </div>
        )}
        <PromptPanel
          prompt={prompt}
          setPrompt={setPrompt}
          imageUrl={imageUrl}
          generating={generating}
          busy={busy}
          locked={g.you.submitted}
          onGenerate={() => generate(prompt)}
          onCancelGenerate={cancelGenerate}
          onSubmit={async () => {
            if (await api('submit', { playerId })) sfx.submit();
          }}
          onUnsubmit={() => api('unsubmit', { playerId })}
        />
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </>
  );
}

export default CoopPlay;
