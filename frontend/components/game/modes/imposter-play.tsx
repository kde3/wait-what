'use client';

import { Check, Eye, Hourglass, Key, Pencil, Search } from 'pixelarticons/react';
import { useState } from 'react';
import { useI18n } from '../../i18n-provider';
import { wordText } from '../../../lib/words';
import { sfx } from '../../../lib/sound';
import { useCountdown } from '../../../hooks/use-countdown';
import { useDraft } from '../../../hooks/use-draft';
import { useGenerate } from '../../../hooks/use-generate';
import { ChatPanel } from '../chat-panel';
import { ImposterVotePanel } from '../imposter-vote-panel';
import { PromptPanel } from '../prompt-panel';
import { TimerBar } from '../timer-bar';
import { StatusBanner } from '../../ui/status-banner';
import { Input } from '@heroui/react';
import { Button } from '../../ui/button';
import { apiUrl } from '../../../lib/backend-url';
// ── 임포스터 ─────────────────────────────────────────────

export function ImposterPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, `${g.turnIndex}`);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.phase}:${g.turnIndex}`);
  const [guessText, setGuessText] = useState('');
  const totalSecs = g.phase === 'turns' ? state.options.imageSeconds : state.options.textSeconds;

  async function sendGuess() {
    if (!guessText.trim()) return;
    const data = await api('guess', { playerId, text: guessText });
    if (data) (data.correct ? sfx.correct : sfx.wrong)();
  }

  async function sendVote(index) {
    if (await api('vote', { playerId, target: index })) sfx.submit();
  }

  async function sendChat(text) {
    await api('chat', { playerId, text });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          <Eye className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" />{' '}
          <b>{g.youAreImposter ? t('imposterYouAreShort') : t('imposterHiddenAmongUs')}</b>
        </span>
        <span className="text-xs text-muted">
          {t('keywordLabel')}: <b>{g.keyword ? wordText(g.keyword, lang) : t('imposterKeywordHidden')}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.youAreImposter && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
          <h2>{t('imposterYouAre')}</h2>
          <p className="text-sm text-muted">{t('imposterYourHint')}</p>
        </div>
      )}

      <ul className="flex flex-wrap gap-2">
        {g.order.map((nick, i) => (
          <li key={i} className={i < g.turnIndex ? 'done' : i === g.turnIndex && g.phase === 'turns' ? 'current' : ''}>
            {i < g.turnIndex ? <Check className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : i === g.turnIndex && g.phase === 'turns' ? <Pencil className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> : <Hourglass className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" />} {nick}
          </li>
        ))}
      </ul>

      {g.entries.length > 0 && (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          <h2>{t('imposterGallery')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.entries.map((e, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-2 text-center text-sm">
                {e.url ? <img className={g.phase === 'guess' ? 'select-none' : undefined} src={apiUrl(e.url)} alt={e.nickname} draggable={g.phase !== 'guess'} /> : <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">{t('skipped')}</div>}
                <span>{e.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <div className="space-y-4 lg:order-2">
          {g.phase === 'turns' && g.youAreCurrent && (
            <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
              <h2><Pencil className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayYourTurn')}</h2>
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
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
            </div>
          )}

          {g.phase === 'vote' && (
            <ImposterVotePanel
              candidates={g.candidates}
              yourVote={g.yourVote}
              votedCount={g.votedCount}
              voterTotal={g.voterTotal}
              busy={busy}
              onVote={sendVote}
            />
          )}

          {g.phase === 'guess' && (
            <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
              <h2><Search className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('imposterCaughtTitle')}</h2>
              <p className="text-sm text-muted">
                {t('imposterAccusedLabel')}: <b>{g.accused}</b>
              </p>
              {g.youAreImposter ? (
                <>
                  <p className="mt-3 font-medium">{t('imposterGuessTitle')}</p>
                  <Input
                    type="text"
                    maxLength={100}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={t('guessInputPlaceholder')}
                    value={guessText}
                    onChange={(e) => setGuessText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendGuess()}
                  />
                  <Button className="w-full" onClick={sendGuess} isDisabled={busy || !guessText.trim()}>
                    {t('guessBtn')}
                  </Button>
                  {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
                </>
              ) : (
                <StatusBanner className="mt-3">{t('imposterGuessWait')}</StatusBanner>
              )}
            </div>
          )}
        </div>

        <ChatPanel
          messages={g.chat}
          busy={busy}
          onSend={sendChat}
          className="lg:order-1 lg:sticky lg:top-[4.5rem]"
          feedClassName="lg:max-h-[calc(100vh-15rem)]"
        />
      </div>
    </>
  );
}

export default ImposterPlay;
