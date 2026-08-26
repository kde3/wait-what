'use client';

import { Check, Key } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n-provider';
import { sfx } from '../../../lib/sound';
import { useCountdown } from '../../../hooks/use-countdown';
import { useDraft } from '../../../hooks/use-draft';
import { useGenerate } from '../../../hooks/use-generate';
import { PromptPanel } from '../prompt-panel';
import { SubmittedNotice } from '../submitted-notice';
import { TimerBar } from '../timer-bar';
import { Input, Surface } from '@heroui/react';
import { Button } from '../../ui/button';
import { apiUrl } from '../../../lib/backend-url';
import type { ChaosCharacterId } from '../../../lib/chaos';
import { ChaosAffectedImage } from '../chaos-affected-image';
// ── 클래식 ──────────────────────────────────────────────

function phraseSuggestion(t) {
  return t('phrasePlaceholder').replace(
    /^(예|e\.g\.|例|ex\.?|z\.\s*b\.|напр\.?|vd|เช่น|contoh)\s*:?[\s]*/i,
    '',
  );
}

export function ClassicPlay({ state, playerId, api, busy, error }) {
  const { t } = useI18n();
  const g = state.game;
  const [text, setText] = useState('');
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, g.round);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}`);

  useEffect(() => setText(g.draft?.text ?? ''), [g.round, g.task.kind]);

  const isFirstPhrase = g.round === 1 && g.task.kind === 'phrase';
  const suggestedPhrase = phraseSuggestion(t);
  const submittedCount = g.players.filter((player) => player.submitted).length;

  const totalSecs = g.roundSeconds ?? (g.task.kind === 'draw' ? state.options.imageSeconds : state.options.textSeconds);

  async function submit() {
    const body: { playerId: string; text?: string } = { playerId };
    if (g.task.kind !== 'draw') body.text = isFirstPhrase && !text.trim() ? suggestedPhrase : text;
    if (await api('submit', body)) sfx.submit();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          {g.round} / {g.total} {t('round')}
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      <div className="text-sm font-medium tabular-nums text-muted">
        {submittedCount} / {g.players.length}
      </div>

      {g.submitted && <SubmittedNotice />}

      <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          {g.task.kind === 'phrase' && (
            <div className="space-y-4">
              <h2>{t('phraseTitle')}</h2>
              <Input
                className="w-full"
                type="text"
                maxLength={200}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={suggestedPhrase}
                value={text}
                disabled={g.submitted}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              {g.submitted ? (
                <Button variant="outline" className="w-full" onClick={() => api('unsubmit', { playerId })} isDisabled={busy}>
                  {t('cancelSubmit')}
                </Button>
              ) : (
                <Button className="w-full" onClick={submit} isDisabled={busy || (!isFirstPhrase && !text.trim())}>
                  {t('submit')}
                </Button>
              )}
            </div>
          )}

          {g.task.kind === 'draw' && (
            <div className="space-y-4">
              <h2>{t('drawTitle')}</h2>
              <Surface className="flex w-full min-w-0 flex-col gap-3 rounded-3xl bg-surface-secondary p-6" variant="default">
                <p className="font-medium text-foreground">“{g.task.sourceText || t('emptyValue')}”</p>
              </Surface>
              <p className="text-sm text-muted">{t('drawHint')}</p>
              {g.kind === 'chaos' && g.activeChaosCharacterId === 'retry' && (
                <p className="text-sm font-medium tabular-nums text-muted">
                  {t('chaosGenerateCount')} {g.generateCount} / 3
                </p>
              )}
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                imageUrl={imageUrl}
                generating={generating}
                busy={busy}
                locked={g.submitted}
                onGenerate={() => generate(prompt)}
                onCancelGenerate={cancelGenerate}
                onSubmit={submit}
                onUnsubmit={() => api('unsubmit', { playerId })}
              />
            </div>
          )}

          {g.task.kind === 'guess' && (
            <div className="space-y-4">
              <h2>{t('guessTitle')}</h2>
              {g.task.sourceImage ? (
                g.kind === 'chaos' ? (
                  <ChaosAffectedImage src={g.task.sourceImage} characterId={g.task.chaosCharacterId as ChaosCharacterId} />
                ) : (
                  <img className="w-full rounded-lg border object-cover" src={apiUrl(g.task.sourceImage)} alt="AI" />
                )
              ) : (
                <p className="text-center text-sm text-muted">{t('guessHint')}</p>
              )}
              <Input
                className="w-full"
                type="text"
                maxLength={200}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('guessPlaceholder')}
                value={text}
                disabled={g.submitted}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              {g.submitted ? (
                <Button variant="outline" className="w-full" onClick={() => api('unsubmit', { playerId })} isDisabled={busy}>
                  {t('cancelSubmit')}
                </Button>
              ) : (
                <Button className="w-full" onClick={submit} isDisabled={busy || !text.trim()}>
                  {t('submit')}
                </Button>
              )}
            </div>
          )}
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </>
  );
}

export default ClassicPlay;
