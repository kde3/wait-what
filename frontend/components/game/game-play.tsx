'use client';

import { Check, Eye, Hourglass, Key, Mic, PartyPopper, Pencil, Search, Target, Trophy, Users, Zap } from 'pixelarticons/react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n-provider';
import { wordText } from '../../lib/words';
import { sfx } from '../../lib/sound';
import { useCountdown, PromptPanel, GuessPanel, TeamBadge } from './game-bits';
import { TimerBar } from './timer-bar';
import { Input, Surface } from '@heroui/react';
import { Button } from '../ui/button';

// 프롬프트/생성이미지 로컬 상태 — resetKey가 바뀌면 서버 draft로 초기화
function useDraft(draft, resetKey) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    setPrompt(draft?.prompt ?? '');
    setImageUrl(draft?.url ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  return { prompt, setPrompt, imageUrl, setImageUrl };
}

function useGenerate(api, playerId, setImageUrl) {
  const [generating, setGenerating] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  async function generate(prompt) {
    if (!prompt.trim() || generating) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerating(true);
    const data = await api('generate', { playerId, prompt }, { signal: controller.signal });
    if (controllerRef.current !== controller) return;
    controllerRef.current = null;
    setGenerating(false);
    if (data?.url) setImageUrl(data.url);
  }
  function cancelGenerate() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setGenerating(false);
  }
  return { generating, generate, cancelGenerate };
}

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

  useEffect(() => setText(''), [g.round, g.task.kind]);

  const isFirstPhrase = g.round === 1 && g.task.kind === 'phrase';
  const suggestedPhrase = phraseSuggestion(t);
  const submittedCount = g.players.filter((player) => player.submitted).length;

  const totalSecs = g.task.kind === 'draw' ? state.options.imageSeconds : state.options.textSeconds;

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

      {g.submitted ? (
        <div className="rounded-xl border bg-surface p-6 text-center text-foreground shadow-sm">
          <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p>
            <b>{t('submitted')}</b> {t('waitingOthers')}
          </p>
          <p className="text-center text-sm text-muted">{t('waitingOthersHint')}</p>
          <Button variant="outline" className="mt-4" onClick={() => api('unsubmit', { playerId })} isDisabled={busy}>
            {t('cancelSubmit')}
          </Button>
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      ) : (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          {g.task.kind === 'phrase' && (
            <div className="space-y-4">
              <h2>{t('phraseTitle')}</h2>
              <Input
                className="w-full"
                type="text"
                maxLength={200}
                autoComplete="off"
                placeholder={suggestedPhrase}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <Button className="w-full" onClick={submit} isDisabled={busy || (!isFirstPhrase && !text.trim())}>
                {t('submit')}
              </Button>
            </div>
          )}

          {g.task.kind === 'draw' && (
            <div className="space-y-4">
              <h2>{t('drawTitle')}</h2>
              <Surface className="flex w-full min-w-0 flex-col gap-3 rounded-3xl bg-surface-secondary p-6" variant="default">
                <p className="font-medium text-foreground">“{g.task.sourceText || t('emptyValue')}”</p>
              </Surface>
              <p className="text-sm text-muted">{t('drawHint')}</p>
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                imageUrl={imageUrl}
                generating={generating}
                busy={busy}
                onGenerate={() => generate(prompt)}
                onCancelGenerate={cancelGenerate}
                onSubmit={submit}
              />
            </div>
          )}

          {g.task.kind === 'guess' && (
            <div className="space-y-4">
              <h2>{t('guessTitle')}</h2>
              {g.task.sourceImage ? (
                <img className="w-full rounded-lg border object-cover" src={g.task.sourceImage} alt="AI" />
              ) : (
                <p className="text-center text-sm text-muted">{t('guessHint')}</p>
              )}
              <Input
                className="w-full"
                type="text"
                maxLength={200}
                autoComplete="off"
                placeholder={t('guessPlaceholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <Button className="w-full" onClick={submit} isDisabled={busy || !text.trim()}>
                {t('submit')}
              </Button>
            </div>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      )}
    </>
  );
}

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
          {g.image && <img className="w-full rounded-lg border object-cover" src={g.image} alt="AI" />}
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
              {g.image && <img className="w-full rounded-lg border object-cover" src={g.image} alt="AI" />}
              <GuessPanel guesses={g.guesses} disabled busy={busy} />
            </>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      ) : (
        <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
          {g.phase === 'draw' ? (
            <div className="py-8 text-center text-sm text-muted">
              <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
              {t('speedWaitingDrawer')}
            </div>
          ) : (
            <>
              <h2>{t('speedGuessTitle')}</h2>
              {g.image && <img className="w-full rounded-lg border object-cover" src={g.image} alt="AI" />}
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

// ── 스피드 퀴즈 팀전 ─────────────────────────────────────

export function SpeedTeamPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, `${g.round}`);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}:${g.phase}`);
  const totalSecs = g.phase === 'play' ? state.options.imageSeconds + state.options.textSeconds : 6;
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
                  <img className="w-full rounded-lg border object-cover" src={g.teams[ti].image} alt="AI" />
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
                  <img className="w-full rounded-lg border object-cover" src={mine.image} alt="AI" />
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
                  onSubmit={async () => {
                    if (await api('submit', { playerId })) sfx.submit();
                  }}
                />
              )}
            </>
          ) : mine.imageReady ? (
            <>
              <img className="w-full rounded-lg border object-cover" src={mine.image} alt="AI" />
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          ) : (
            <>
              <div className="py-8 text-center text-sm text-muted">
                <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                {t('teamImageWaiting')}
              </div>
              <GuessPanel guesses={g.guesses} disabled busy={busy} />
            </>
          )}
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      )}
    </>
  );
}

// ── 릴레이 그림 수정 ─────────────────────────────────────

export function RelayPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const myGroup = g.groups[g.yourGroup];
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(myGroup?.draft, `${g.yourGroup}:${myGroup?.turn}`);
  const { generating, generate, cancelGenerate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(myGroup?.remaining ?? 0, `${g.yourGroup}:${myGroup?.turn}`);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          <Target className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayThemeLabel')}: <b>{wordText(g.theme, lang)}</b>
        </span>
        <span className="text-xs text-muted">
          {t('turn')} {Math.min(myGroup.turn, myGroup.totalTurns)} / {myGroup.totalTurns}
        </span>
      </div>
      {!myGroup.done && <TimerBar remaining={remaining} total={state.options.imageSeconds} />}

      {g.groups.map((group, gi) => (
        <div key={gi} className={gi === g.yourGroup ? 'rounded-xl border bg-surface p-5 shadow-sm' : 'rounded-xl border bg-surface p-5 opacity-70 shadow-sm'}>
          {g.teamMode && (
            <h2>
              <TeamBadge team={gi} />
            </h2>
          )}
          {gi === g.yourGroup && group.youAreCurrent && !group.done ? (
            <>
              <h2><Pencil className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayYourTurn')}</h2>
              {group.currentImage && !imageUrl && <img className="w-full rounded-lg border object-cover" src={group.currentImage} alt="AI" />}
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
            </>
          ) : (
            <>
              {!group.done && (
                <p className="text-sm text-muted">
                  <Pencil className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('relayWaitTurn')}: <b>{group.turnNickname}</b>
                </p>
              )}
              {group.currentImage ? (
                <img className="w-full rounded-lg border object-cover" src={group.currentImage} alt="AI" />
              ) : (
                <div className="py-8 text-center text-sm text-muted">
                  <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                </div>
              )}
            </>
          )}
          {group.entries.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {group.entries.map((e, i) =>
                e.url ? <img key={i} src={e.url} alt={e.nickname} title={e.nickname} /> : null,
              )}
            </div>
          )}
          {gi === g.yourGroup && error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      ))}
    </>
  );
}

// ── 협동 ────────────────────────────────────────────────

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
              <div key={ci} className={cell.you ? 'aspect-square overflow-hidden border-2 border-accent' : 'aspect-square overflow-hidden border'}>
                {cell.url ? (
                  <img src={cell.url} alt={cell.nickname} />
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
        {g.you.submitted ? (
          <div className="py-8 text-center text-sm text-muted">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p>
              <b>{t('submitted')}</b> {t('waitingOthers')}
            </p>
            <Button variant="outline" className="mt-3" onClick={() => api('unsubmit', { playerId })} isDisabled={busy}>
              {t('cancelSubmit')}
            </Button>
          </div>
        ) : (
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
        )}
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </>
  );
}

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
        <span>
          <Eye className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('imposterPublic')}: <b>{g.imposter}</b>
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
      {g.youAreModerator && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
          <p className="text-sm text-muted"><Mic className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('youAreModerator')}</p>
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
                {e.url ? <img src={e.url} alt={e.nickname} /> : <div className="grid size-full min-h-24 place-items-center bg-surface-secondary text-xs text-muted">{t('skipped')}</div>}
                <span>{e.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {g.phase === 'guess' &&
        (g.youAreImposter ? (
          <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
            <h2><Search className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {t('imposterGuessTitle')}</h2>
            <Input
              type="text"
              maxLength={100}
              placeholder={t('guessInputPlaceholder')}
              value={guessText}
              onChange={(e) => setGuessText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendGuess()}
            />
            <Button className="w-full" onClick={sendGuess} isDisabled={busy || !guessText.trim()}>
              {t('guessBtn')}
            </Button>
            {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
          </div>
        ) : (
          <div className="rounded-xl border bg-surface p-6 text-center text-foreground shadow-sm">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            {t('imposterGuessWait')}
          </div>
        ))}
    </>
  );
}

// ── 점수판 ──────────────────────────────────────────────

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


