'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../i18n-provider';
import { LANGS, LANG_LABELS } from '../../lib/i18n';
import { getVolume, isMuted, setMuted, setVolume, sfx } from '../../lib/sound';
import { Popover, Slider } from '@heroui/react';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { ArrowLeft, Volume2, VolumeX } from 'pixelarticons/react';
import { ProfileAvatar } from '../home/profile-avatar';
import { ThemeMenu } from '../home/theme-menu';

interface HeaderProps {
  nickname?: string;
  onBackToProfile?: () => void;
  onBack?: () => void;
}

export default function Header({ nickname, onBackToProfile, onBack }: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const [muted, setMutedState] = useState(true);
  const [volume, setVolumeState] = useState(0.6);

  useEffect(() => {
    setMutedState(isMuted());
    setVolumeState(getVolume());
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.pop();
  }

  function changeVolume(next: number) {
    setVolumeState(next);
    setVolume(next);
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
        <Popover>
          <Popover.Trigger>
            <Button isIconOnly variant="tertiary" aria-label={t('volume')}>
              {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-56">
            <Popover.Dialog className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{t('volume')}</span>
                <Button
                  isIconOnly
                  variant="tertiary"
                  className="size-8"
                  onClick={toggleMute}
                  aria-label={muted ? t('unmute') : t('mute')}
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
              </div>
              <Slider
                aria-label={t('volume')}
                minValue={0}
                maxValue={100}
                step={5}
                value={Math.round(volume * 100)}
                isDisabled={muted}
                onChange={(next) => changeVolume((Array.isArray(next) ? next[0] : next) / 100)}
                onChangeEnd={() => !muted && sfx.pop()}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <span className="text-right text-xs tabular-nums text-muted">{Math.round(volume * 100)}%</span>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
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
