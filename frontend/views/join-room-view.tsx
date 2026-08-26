'use client';

import { useState } from 'react';
import { Input, Label, TextField } from '@heroui/react';
import { Button } from '../components/ui/button';
import { useI18n } from '../components/i18n-provider';

interface JoinRoomViewProps {
  code: string;
  nickname: string;
  needsPassword?: boolean;
  busy?: boolean;
  error?: string;
  onJoin: (password: string) => void | Promise<void>;
}

export function JoinRoomView({ code, nickname, needsPassword = false, busy = false, error = '', onJoin }: JoinRoomViewProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-center text-3xl font-bold tracking-tight">{t('appName')}</h1>
      <p className="text-center text-sm text-muted">
        {t('roomCodeLabel')}: <b>{code}</b>
      </p>
      <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
        <p className="mb-3 text-center text-sm text-muted">{nickname}</p>
        {needsPassword && (
          <TextField fullWidth name="roomPassword" type="password">
            <Label>{t('roomPassword')}</Label>
            <Input
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              type="password"
              maxLength={32}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onJoin(password)}
            />
          </TextField>
        )}
        <Button className="w-full" onClick={() => onJoin(password)} isDisabled={busy}>
          {t('join')}
        </Button>
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </main>
  );
}
