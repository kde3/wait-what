'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../i18n-provider';
import { LANGS, LANG_LABELS } from '../../lib/i18n';
import { isMuted, setMuted, sfx } from '../../lib/sound';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { ArrowLeft, Volume2, VolumeX } from 'pixelarticons/react';
import { ProfileAvatar } from '../ui/profile-avatar';
import { ThemeMenu } from './theme-menu';

interface TopBarProps {
  nickname?: string;
  onBackToProfile?: () => void;
  onBack?: () => void;
}

export default function TopBar({ nickname, onBackToProfile, onBack }: TopBarProps) {
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
  }

  const backHandler = onBack ?? onBackToProfile;

  return (
    <header className="sticky top-0 z-40 border-b bg-surface/95 backdrop-blur">
      <div className={`mx-auto flex h-14 w-full max-w-5xl items-center px-4 ${backHandler ? 'justify-between' : 'justify-end'}`}>
        {backHandler && (
          <Button isIconOnly variant="tertiary" onClick={backHandler} aria-label={onBack ? '뒤로가기' : t('profileSettings')}>
            <ArrowLeft className="size-5" />
          </Button>
        )}
      <div className="flex items-center gap-2">
        <Select value={lang} onChange={(value) => setLang(String(value))} aria-label={t('language')} className="w-28">
          {LANGS.map((l) => (
            <Select.Item key={l} id={l} textValue={LANG_LABELS[l]}>
              {LANG_LABELS[l]}
            </Select.Item>
          ))}
        </Select>
        <ThemeMenu />
        <Button isIconOnly variant="tertiary" onClick={toggleMute} aria-label={muted ? t('unmute') : t('mute')}>
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </Button>
        {nickname && (
          <div className="flex min-w-0 items-center gap-2" aria-label={`${t('nickname')}: ${nickname}`}>
            <span className="max-w-20 truncate text-sm font-medium text-foreground sm:max-w-28">
              {nickname}
            </span>
            <ProfileAvatar nickname={nickname} className="size-8 shrink-0" />
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
