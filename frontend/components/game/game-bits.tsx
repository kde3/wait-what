'use client';

import { Check } from 'pixelarticons/react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Input } from '@heroui/react';
import { Button } from '../ui/button';
import { ImagePromptInput } from './image-prompt-input';

// 생성 이미지 미리보기 + 프롬프트 입력 + 제출 버튼
export function PromptPanel({ prompt, setPrompt, imageUrl, generating, busy, onGenerate, onCancelGenerate, onSubmit, submitLabel }: any) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      {imageUrl && <img className="w-full rounded-lg border object-cover" src={imageUrl} alt="AI" />}
      <ImagePromptInput
        value={prompt}
        isPending={generating}
        disabled={busy && !generating}
        onChange={setPrompt}
        onSubmit={onGenerate}
        onCancel={onCancelGenerate}
      />
      {onSubmit && imageUrl && (
        <Button className="w-full" onClick={onSubmit} isDisabled={busy || generating}>
          {submitLabel ?? t('submitImage')}
        </Button>
      )}
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
            <span>{g.correct ? <><Check className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {g.text ?? t('correctMark')}</> : g.text}</span>
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
