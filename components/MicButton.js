'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { SPEECH_LANGS } from '../lib/i18n';

// 음성 프롬프트 입력 (Web Speech API) — 미지원 브라우저에선 숨김
export default function MicButton({ onText, disabled }) {
  const { lang, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SPEECH_LANGS[lang] ?? 'ko-KR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript ?? '';
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      type="button"
      className={`icon-btn mic-btn ${listening ? 'listening' : ''}`}
      onClick={toggle}
      disabled={disabled}
      title={t('micTitle')}
    >
      🎤
    </button>
  );
}
