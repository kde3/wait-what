'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { sfx } from '../lib/sound';
import MicButton from './MicButton';
import { Button, Input, ProgressBar } from '@heroui/react';

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
    <div className="flex items-center gap-3">
      <ProgressBar aria-label="Time remaining" value={pct} className="flex-1">
        <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
      </ProgressBar>
      <span className={remaining <= 10 ? 'font-medium tabular-nums text-danger' : 'font-medium tabular-nums'}>⏱ {remaining}s</span>
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
export function PromptPanel({ prompt, setPrompt, imageUrl, generating, busy, onGenerate, onSubmit, submitLabel }: any) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      {imageUrl && <img className="w-full rounded-lg border object-cover" src={imageUrl} alt="AI" />}
      {generating && (
        <div className="py-8 text-center text-sm text-muted">
          <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          {t('generating')}
        </div>
      )}
      <div className="flex items-start gap-2">
        <Input
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
      <div className="flex gap-2 [&>*]:flex-1">
        <Button variant="secondary" onClick={onGenerate} isDisabled={generating || busy || !prompt.trim()}>
          {imageUrl ? t('regenerate') : t('generate')}
        </Button>
        {onSubmit && (
          <Button onClick={onSubmit} isDisabled={busy || generating || !imageUrl}>
            {submitLabel ?? t('submitImage')}
          </Button>
        )}
      </div>
    </div>
  );
}

// 정답 추측 피드 + 입력 (스피드 퀴즈 계열)
export function GuessPanel({ guesses, onGuess, disabled, busy }: any) {
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
    <div className="space-y-2">
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-surface-secondary p-3" ref={feedRef}>
        {(guesses ?? []).map((g, i) => (
          <div key={i} className={g.correct ? 'flex gap-2 text-sm font-medium text-accent' : 'flex gap-2 text-sm'}>
            <b>{g.nickname}</b>
            <span>{g.correct ? `✅ ${g.text ?? t('correctMark')}` : g.text}</span>
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex items-start gap-2">
          <Input
            type="text"
            maxLength={100}
            placeholder={t('guessInputPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <Button className="w-auto shrink-0" onClick={send} isDisabled={busy || !text.trim()}>
            {t('guessBtn')}
          </Button>
        </div>
      )}
    </div>
  );
}

export function TeamBadge({ team }) {
  const { t } = useI18n();
  if (team !== 0 && team !== 1) return null;
  return <span className="inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-foreground">{team === 0 ? t('teamA') : t('teamB')}</span>;
}
