'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LANGS, translate } from '../lib/i18n';
import { Toast } from '@heroui/react';

type I18nValue = { lang: string; setLang: (lang: string) => void; t: (key: string) => string };
const I18nContext = createContext<I18nValue>({ lang: 'ko', setLang: () => {}, t: (key) => key });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState('ko');

  useEffect(() => {
    const saved = window.localStorage.getItem('ww_lang');
    if (saved && LANGS.includes(saved)) {
      setLangState(saved);
    } else {
      const nav = (navigator.language || 'ko').slice(0, 2);
      if (LANGS.includes(nav)) setLangState(nav);
    }
  }, []);

  const setLang = (l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    window.localStorage.setItem('ww_lang', l);
  };

  const t = (key) => translate(lang, key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
      <Toast.Provider placement="bottom" />
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}


