'use client';

import { Check } from 'pixelarticons/react';
import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Input } from '@heroui/react';
import { Button } from '../ui/button';
import { ScrollFeed } from '../ui/scroll-feed';

// 정답 추측 피드 + 입력 (스피드 퀴즈 계열)
export function GuessPanel({ guesses, onGuess, disabled, busy }: any) {
  const { t } = useI18n();
  const [text, setText] = useState('');

  async function send() {
    const value = text.trim();
    if (!value) return;
    setText('');
    await onGuess(value);
  }

  return (
    <div className="space-y-2">
      <ScrollFeed bottomKey={guesses?.length}>
        {(guesses ?? []).map((g, i) => (
          <div key={i} className={g.correct ? 'flex gap-2 text-sm font-medium text-accent' : 'flex gap-2 text-sm'}>
            <b>{g.nickname}</b>
            <span>{g.correct ? <><Check className="inline-block size-[1em] align-[-0.125em]" aria-hidden="true" /> {g.text ?? t('correctMark')}</> : g.text}</span>
          </div>
        ))}
      </ScrollFeed>
      {!disabled && (
        <div className="flex items-start gap-2">
          <Input
            type="text"
            maxLength={100}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
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

export default GuessPanel;
