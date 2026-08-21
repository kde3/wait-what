'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { sfx } from '../lib/sound';
import MicButton from './MicButton';

// 남은 시간 표시 + 5초 이하 틱 사운드
export function TimerBar({ remaining, total }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const lastRef = useRef(remaining);
  useEffect(() => {
    if (remaining !== lastRef.current) {
      lastRef.current = remaining;
      if (remaining > 0 && remaining <= 5) sfx.tick();
    }
  }, [remaining]);
  return (
    <div className="timerbar">
      <div className="timerbar-track">
        <div className={`timerbar-fill ${remaining <= 10 ? 'low' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`timer ${remaining <= 10 ? 'low' : ''}`}>⏱ {remaining}s</span>
    </div>
  );
}

// 서버 remaining을 받아 초 단위로 로컬 카운트다운
export function useCountdown(serverRemaining, resetKey) {
  const [remaining, setRemaining] = useState(serverRemaining ?? 0);
  useEffect(() => {
    setRemaining(serverRemaining ?? 0);
  }, [serverRemaining, resetKey]);
  useEffect(() => {
    const timer = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);
  return remaining;
}

// 프롬프트 입력 + 마이크 + 생성/제출 버튼 + 생성 이미지 미리보기
export function PromptPanel({ prompt, setPrompt, imageUrl, generating, busy, onGenerate, onSubmit, submitLabel }) {
  const { t } = useI18n();
  return (
    <div className="prompt-panel">
      {imageUrl && <img className="game-image" src={imageUrl} alt="AI" />}
      {generating && (
        <div className="waiting">
          <div className="spinner" />
          {t('generating')}
        </div>
      )}
      <div className="prompt-row">
        <input
          type="text"
          maxLength={300}
          placeholder={t('promptPlaceholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
          disabled={generating}
        />
        <MicButton onText={(text) => setPrompt((p) => (p ? p + ' ' + text : text))} disabled={generating} />
      </div>
      <div className="btn-row">
        <button className="secondary" onClick={onGenerate} disabled={generating || busy || !prompt.trim()}>
          {imageUrl ? t('regenerate') : t('generate')}
        </button>
        {onSubmit && (
          <button onClick={onSubmit} disabled={busy || generating || !imageUrl}>
            {submitLabel ?? t('submitImage')}
          </button>
        )}
      </div>
    </div>
  );
}

// 정답 추측 피드 + 입력 (스피드 퀴즈 계열)
export function GuessPanel({ guesses, onGuess, disabled, busy }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [guesses?.length]);

  async function send() {
    const value = text.trim();
    if (!value) return;
    setText('');
    await onGuess(value);
  }

  return (
    <div className="guess-panel">
      <div className="guess-feed" ref={feedRef}>
        {(guesses ?? []).map((g, i) => (
          <div key={i} className={`guess-item ${g.correct ? 'correct' : ''}`}>
            <b>{g.nickname}</b>
            <span>{g.correct ? `✅ ${g.text ?? t('correctMark')}` : g.text}</span>
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="prompt-row">
          <input
            type="text"
            maxLength={100}
            placeholder={t('guessInputPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="inline-btn" onClick={send} disabled={busy || !text.trim()}>
            {t('guessBtn')}
          </button>
        </div>
      )}
    </div>
  );
}

export function TeamBadge({ team }) {
  const { t } = useI18n();
  if (team !== 0 && team !== 1) return null;
  return <span className={`team-badge team-${team}`}>{team === 0 ? t('teamA') : t('teamB')}</span>;
}
