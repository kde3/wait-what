'use client';

import { useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { wordText } from '../lib/words';
import { sfx } from '../lib/sound';
import { TimerBar, useCountdown, PromptPanel, GuessPanel, TeamBadge } from './GameBits';

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
  async function generate(prompt) {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    const data = await api('generate', { playerId, prompt });
    setGenerating(false);
    if (data?.url) setImageUrl(data.url);
  }
  return { generating, generate };
}

// ── 클래식 ──────────────────────────────────────────────

export function ClassicPlay({ state, playerId, api, busy, error }) {
  const { t } = useI18n();
  const g = state.game;
  const [text, setText] = useState('');
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, g.round);
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}`);

  useEffect(() => setText(''), [g.round]);

  const totalSecs = g.task.kind === 'draw' ? state.options.imageSeconds : state.options.textSeconds;

  async function submit() {
    const body = { playerId };
    if (g.task.kind !== 'draw') body.text = text;
    if (await api('submit', body)) sfx.submit();
  }

  return (
    <>
      <div className="round-header">
        <span>
          {g.round} / {g.total} {t('round')}
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      <ul className="player-list status-list">
        {g.players.map((p, i) => (
          <li key={i} className={p.submitted ? 'done' : ''}>
            {p.submitted ? '✅' : '⏳'} {p.nickname}
          </li>
        ))}
      </ul>

      {g.submitted ? (
        <div className="card waiting">
          <div className="spinner" />
          <p>
            <b>{t('submitted')}</b> {t('waitingOthers')}
          </p>
          <p className="hint">{t('waitingOthersHint')}</p>
          <button className="secondary" onClick={() => api('unsubmit', { playerId })} disabled={busy} style={{ marginTop: 16 }}>
            {t('cancelSubmit')}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="card">
          {g.task.kind === 'phrase' && (
            <>
              <h2>{t('phraseTitle')}</h2>
              <p className="hint-left">{t('phraseHint')}</p>
              <input
                type="text"
                maxLength={200}
                placeholder={t('phrasePlaceholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <button onClick={submit} disabled={busy || !text.trim()}>
                {t('submit')}
              </button>
            </>
          )}

          {g.task.kind === 'draw' && (
            <>
              <h2>{t('drawTitle')}</h2>
              <div className="source-text">“{g.task.sourceText}”</div>
              <p className="hint-left">{t('drawHint')}</p>
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                imageUrl={imageUrl}
                generating={generating}
                busy={busy}
                onGenerate={() => generate(prompt)}
                onSubmit={submit}
              />
            </>
          )}

          {g.task.kind === 'guess' && (
            <>
              <h2>{t('guessTitle')}</h2>
              {g.task.sourceImage ? (
                <img className="game-image" src={g.task.sourceImage} alt="AI" />
              ) : (
                <p className="hint">{t('guessHint')}</p>
              )}
              <input
                type="text"
                maxLength={200}
                placeholder={t('guessPlaceholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <button onClick={submit} disabled={busy || !text.trim()}>
                {t('submit')}
              </button>
            </>
          )}
          {error && <p className="error">{error}</p>}
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
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, `${g.round}:${g.phase}`);
  const totalSecs =
    g.phase === 'draw' ? state.options.imageSeconds : g.phase === 'guess' ? state.options.textSeconds : 6;

  async function onGuess(text) {
    const data = await api('guess', { playerId, text });
    if (data) (data.correct ? sfx.correct : sfx.wrong)();
  }

  return (
    <>
      <div className="round-header">
        <span>
          {g.round} / {g.total} {t('round')}
        </span>
        <span className="hint-inline">
          {t('speedDrawerIs')}: <b>{g.drawer}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.phase === 'reveal' ? (
        <div className="card reveal-card">
          <h2>{g.winner ? `🎉 ${t('roundWinner')}: ${g.winner}` : t('noWinner')}</h2>
          <p className="keyword-reveal">
            {t('keywordWas')}: <b>{wordText(g.keyword, lang)}</b>
          </p>
          {g.image && <img className="game-image" src={g.image} alt="AI" />}
        </div>
      ) : g.youAreDrawer ? (
        <div className="card">
          <h2>{t('speedDrawTitle')}</h2>
          <div className="keyword-chip">🔑 {wordText(g.keyword, lang)}</div>
          {g.phase === 'draw' ? (
            <PromptPanel
              prompt={prompt}
              setPrompt={setPrompt}
              imageUrl={imageUrl}
              generating={generating}
              busy={busy}
              onGenerate={() => generate(prompt)}
              onSubmit={async () => {
                if (await api('submit', { playerId })) sfx.submit();
              }}
            />
          ) : (
            <>
              {g.image && <img className="game-image" src={g.image} alt="AI" />}
              <GuessPanel guesses={g.guesses} disabled busy={busy} />
            </>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="card">
          {g.phase === 'draw' ? (
            <div className="waiting">
              <div className="spinner" />
              {t('speedWaitingDrawer')}
            </div>
          ) : (
            <>
              <h2>{t('speedGuessTitle')}</h2>
              {g.image && <img className="game-image" src={g.image} alt="AI" />}
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          )}
          {error && <p className="error">{error}</p>}
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
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
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
      <div className="round-header">
        <span>
          {g.round} / {g.total} {t('round')}
        </span>
        <span className="team-scores">
          <span className="team-badge team-0">{t('teamA')} {g.teamScores[0]}</span>
          <span className="team-badge team-1">{t('teamB')} {g.teamScores[1]}</span>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.phase === 'reveal' ? (
        <div className="card reveal-card">
          <h2>
            {g.winnerTeam != null
              ? `🎉 ${t('winnerTeamLabel')}: ${g.winnerTeam === 0 ? t('teamA') : t('teamB')} (${g.winner})`
              : t('noWinner')}
          </h2>
          <p className="keyword-reveal">
            {t('keywordWas')}: <b>{wordText(g.keyword, lang)}</b>
          </p>
          <div className="image-pair">
            {[0, 1].map((ti) =>
              g.teams[ti].image ? (
                <div key={ti} className="image-pair-item">
                  <TeamBadge team={ti} />
                  <img className="game-image" src={g.teams[ti].image} alt="AI" />
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="lobby-head">
            <h2>
              <TeamBadge team={myTeam} /> {t('yourTeam')}
            </h2>
            <span className="hint-inline">
              {t('speedDrawerIs')}: <b>{mine.drawer}</b> · {other.imageReady ? '⚡' : '⏳'} {g.teams[1 - myTeam].drawer}
            </span>
          </div>

          {g.youAreDrawer ? (
            <>
              <div className="keyword-chip">🔑 {wordText(g.keyword, lang)}</div>
              {mine.imageReady ? (
                <>
                  <img className="game-image" src={mine.image} alt="AI" />
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
                  onSubmit={async () => {
                    if (await api('submit', { playerId })) sfx.submit();
                  }}
                />
              )}
            </>
          ) : mine.imageReady ? (
            <>
              <img className="game-image" src={mine.image} alt="AI" />
              <GuessPanel guesses={g.guesses} onGuess={onGuess} busy={busy} />
            </>
          ) : (
            <>
              <div className="waiting">
                <div className="spinner" />
                {t('teamImageWaiting')}
              </div>
              <GuessPanel guesses={g.guesses} disabled busy={busy} />
            </>
          )}
          {error && <p className="error">{error}</p>}
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
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(myGroup?.remaining ?? 0, `${g.yourGroup}:${myGroup?.turn}`);

  return (
    <>
      <div className="round-header">
        <span>
          🎯 {t('relayThemeLabel')}: <b>{wordText(g.theme, lang)}</b>
        </span>
        <span className="hint-inline">
          {t('turn')} {Math.min(myGroup.turn, myGroup.totalTurns)} / {myGroup.totalTurns}
        </span>
      </div>
      {!myGroup.done && <TimerBar remaining={remaining} total={state.options.imageSeconds} />}

      {g.groups.map((group, gi) => (
        <div key={gi} className={`card ${gi === g.yourGroup ? '' : 'other-group'}`}>
          {g.teamMode && (
            <h2>
              <TeamBadge team={gi} />
            </h2>
          )}
          {gi === g.yourGroup && group.youAreCurrent && !group.done ? (
            <>
              <h2>🖌️ {t('relayYourTurn')}</h2>
              {group.currentImage && !imageUrl && <img className="game-image" src={group.currentImage} alt="AI" />}
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                imageUrl={imageUrl}
                generating={generating}
                busy={busy}
                onGenerate={() => generate(prompt)}
                onSubmit={async () => {
                  if (await api('submit', { playerId })) sfx.submit();
                }}
              />
            </>
          ) : (
            <>
              {!group.done && (
                <p className="hint-left">
                  ✏️ {t('relayWaitTurn')}: <b>{group.turnNickname}</b>
                </p>
              )}
              {group.currentImage ? (
                <img className="game-image" src={group.currentImage} alt="AI" />
              ) : (
                <div className="waiting">
                  <div className="spinner" />
                </div>
              )}
            </>
          )}
          {group.entries.length > 0 && (
            <div className="history-strip">
              {group.entries.map((e, i) =>
                e.url ? <img key={i} src={e.url} alt={e.nickname} title={e.nickname} /> : null,
              )}
            </div>
          )}
          {gi === g.yourGroup && error && <p className="error">{error}</p>}
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
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
  const remaining = useCountdown(g.remaining, 'coop');

  return (
    <>
      <div className="round-header">
        <span>
          🎯 {t('relayThemeLabel')}: <b>{wordText(g.theme, lang)}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={state.options.imageSeconds} />

      {g.groups.map((group, gi) => (
        <div key={gi} className="card">
          {g.teamMode && (
            <h2>
              <TeamBadge team={gi} />
            </h2>
          )}
          <div className="coop-grid" style={{ gridTemplateColumns: `repeat(${group.cols}, 1fr)` }}>
            {group.cells.map((cell, ci) => (
              <div key={ci} className={`coop-cell ${cell.you ? 'you' : ''}`}>
                {cell.url ? (
                  <img src={cell.url} alt={cell.nickname} />
                ) : (
                  <div className="coop-empty">
                    <span>{cell.submitted ? '✅' : '⏳'}</span>
                    <span>{cell.nickname}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <h2>🧩 {t('coopTitle')}</h2>
        {g.you.submitted ? (
          <div className="waiting">
            <div className="spinner" />
            <p>
              <b>{t('submitted')}</b> {t('waitingOthers')}
            </p>
            <button className="secondary" onClick={() => api('unsubmit', { playerId })} disabled={busy} style={{ marginTop: 12 }}>
              {t('cancelSubmit')}
            </button>
          </div>
        ) : (
          <PromptPanel
            prompt={prompt}
            setPrompt={setPrompt}
            imageUrl={imageUrl}
            generating={generating}
            busy={busy}
            onGenerate={() => generate(prompt)}
            onSubmit={async () => {
              if (await api('submit', { playerId })) sfx.submit();
            }}
          />
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}

// ── 임포스터 ─────────────────────────────────────────────

export function ImposterPlay({ state, playerId, api, busy, error }) {
  const { t, lang } = useI18n();
  const g = state.game;
  const { prompt, setPrompt, imageUrl, setImageUrl } = useDraft(g.draft, `${g.turnIndex}`);
  const { generating, generate } = useGenerate(api, playerId, setImageUrl);
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
      <div className="round-header">
        <span>
          🕵️ {t('imposterPublic')}: <b>{g.imposter}</b>
        </span>
        <span className="hint-inline">
          {t('keywordLabel')}: <b>{g.keyword ? wordText(g.keyword, lang) : t('imposterKeywordHidden')}</b>
        </span>
      </div>
      <TimerBar remaining={remaining} total={totalSecs} />

      {g.youAreImposter && (
        <div className="card imposter-card">
          <h2>{t('imposterYouAre')}</h2>
          <p className="hint-left">{t('imposterYourHint')}</p>
        </div>
      )}
      {g.youAreModerator && (
        <div className="card imposter-card">
          <p className="hint-left">🎙️ {t('youAreModerator')}</p>
        </div>
      )}

      <ul className="player-list status-list">
        {g.order.map((nick, i) => (
          <li key={i} className={i < g.turnIndex ? 'done' : i === g.turnIndex && g.phase === 'turns' ? 'current' : ''}>
            {i < g.turnIndex ? '✅' : i === g.turnIndex && g.phase === 'turns' ? '🖌️' : '⏳'} {nick}
          </li>
        ))}
      </ul>

      {g.entries.length > 0 && (
        <div className="card">
          <h2>{t('imposterGallery')}</h2>
          <div className="gallery-grid">
            {g.entries.map((e, i) => (
              <div key={i} className="gallery-item">
                {e.url ? <img src={e.url} alt={e.nickname} /> : <div className="coop-empty">{t('skipped')}</div>}
                <span>{e.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {g.phase === 'turns' && g.youAreCurrent && (
        <div className="card">
          <h2>🖌️ {t('relayYourTurn')}</h2>
          <PromptPanel
            prompt={prompt}
            setPrompt={setPrompt}
            imageUrl={imageUrl}
            generating={generating}
            busy={busy}
            onGenerate={() => generate(prompt)}
            onSubmit={async () => {
              if (await api('submit', { playerId })) sfx.submit();
            }}
          />
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {g.phase === 'guess' &&
        (g.youAreImposter ? (
          <div className="card">
            <h2>🔎 {t('imposterGuessTitle')}</h2>
            <input
              type="text"
              maxLength={100}
              placeholder={t('guessInputPlaceholder')}
              value={guessText}
              onChange={(e) => setGuessText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendGuess()}
            />
            <button onClick={sendGuess} disabled={busy || !guessText.trim()}>
              {t('guessBtn')}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        ) : (
          <div className="card waiting">
            <div className="spinner" />
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
    <div className="card scoreboard">
      <h2>🏆 {t('scoreboard')}</h2>
      {teamScores ? (
        <div className="team-scores big">
          <span className="team-badge team-0">
            {t('teamA')} {teamScores[0]}
          </span>
          <span className="team-badge team-1">
            {t('teamB')} {teamScores[1]}
          </span>
        </div>
      ) : (
        <ul className="score-list">
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
