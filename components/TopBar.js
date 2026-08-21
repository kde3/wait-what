'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from './I18nProvider';
import { LANGS, LANG_LABELS } from '../lib/i18n';
import { isMuted, setMuted, sfx, stopBgm } from '../lib/sound';

export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="4" width="36" height="56" rx="9" fill="#7c5cff" />
      <rect x="11" y="11" width="26" height="36" rx="4" fill="#12121c" />
      <circle cx="24" cy="53" r="3.5" fill="#12121c" opacity="0.6" />
      <path d="M52 14c6 6 8 15 3 22L38 58l-8-8 22-19c-4-5-4-12 0-17z" fill="#ffd166" />
      <circle cx="20" cy="20" r="4" fill="#ff6b81" />
      <circle cx="30" cy="26" r="4" fill="#4cc9f0" />
      <circle cx="20" cy="33" r="4" fill="#7bc043" />
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
    <header className="topbar">
      <Link href="/" className="topbar-logo">
        <Logo />
        <span>{t('appName')}</span>
      </Link>
      <div className="topbar-actions">
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t('language')}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_LABELS[l]}
            </option>
          ))}
        </select>
        <button className="icon-btn" onClick={toggleMute} title={muted ? t('unmute') : t('mute')}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
