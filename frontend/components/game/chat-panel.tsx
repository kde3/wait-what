'use client';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '../i18n-provider';
import { Input } from '@heroui/react';
import { Button } from '../ui/button';
import { ScrollFeed } from '../ui/scroll-feed';

export interface ChatMessage {
  nickname: string;
  text: string;
  you?: boolean;
}

interface ChatPanelProps {
  messages?: ChatMessage[];
  busy?: boolean;
  className?: string;
  feedClassName?: string;
  onSend: (text: string) => void | Promise<void>;
}

export function ChatPanel({ messages = [], busy = false, className, feedClassName, onSend }: ChatPanelProps) {
  const { t } = useI18n();
  const [text, setText] = useState('');

  async function send() {
    const value = text.trim();
    if (!value) return;
    setText('');
    await onSend(value);
  }

  return (
    <div className={twMerge('rounded-xl border bg-surface p-5 text-foreground shadow-sm', className)}>
      <h2>{t('chatTitle')}</h2>
      <ScrollFeed bottomKey={messages.length} className={twMerge('mt-2', feedClassName)}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted">{t('chatEmpty')}</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <b className={m.you ? 'shrink-0 text-accent' : 'shrink-0'}>{m.nickname}</b>
              <span className="min-w-0 break-words">{m.text}</span>
            </div>
          ))
        )}
      </ScrollFeed>
      <div className="mt-2 flex items-start gap-2">
        <Input
          type="text"
          maxLength={200}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t('chatPlaceholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <Button className="w-auto shrink-0" onClick={send} isDisabled={busy || !text.trim()}>
          {t('chatSend')}
        </Button>
      </div>
    </div>
  );
}

export default ChatPanel;
