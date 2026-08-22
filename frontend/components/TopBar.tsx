'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from './I18nProvider';
import { LANGS, LANG_LABELS } from '../lib/i18n';
import { isMuted, setMuted, sfx, stopBgm } from '../lib/sound';
import { Button, ListBox, Select } from '@heroui/react';

export function Logo({ size = 28 }) {
  return (
    <svg className="size-7" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M24 12 19 4M40 12l5-8" stroke="var(--green-900)" strokeWidth="5" strokeLinecap="round" />
      <rect x="8" y="12" width="48" height="40" rx="15" fill="var(--green-500)" />
      <rect x="15" y="19" width="34" height="25" rx="9" fill="var(--surface-muted)" />
      <circle cx="25" cy="31" r="3.5" fill="var(--green-900)" />
      <circle cx="39" cy="31" r="3.5" fill="var(--green-900)" />
      <path d="M27 38c3 2 7 2 10 0" stroke="var(--green-900)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="8" cy="30" r="5" fill="var(--green-900)" />
      <circle cx="56" cy="30" r="5" fill="var(--green-900)" />
    </svg>
  );
}

export default function TopBar() {
  const { lang, setLang, t } = useI18n();
  const [muted, setMutedState] = useState(true);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.pop();
    else stopBgm();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
        <Logo />
        <span>{t('appName')}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Select value={lang} onChange={(value) => setLang(String(value))} aria-label={t('language')} className="w-28">
          <Select.Trigger><Select.Value /></Select.Trigger>
          <Select.Popover><ListBox>
          {LANGS.map((l) => (
            <ListBox.Item key={l} id={l} textValue={LANG_LABELS[l]}>
              {LANG_LABELS[l]}
            </ListBox.Item>
          ))}
          </ListBox></Select.Popover>
        </Select>
        <Button isIconOnly onClick={toggleMute} aria-label={muted ? t('unmute') : t('mute')}>
          {muted ? '🔇' : '🔊'}
        </Button>
      </div>
      </div>
    </header>
  );
}


