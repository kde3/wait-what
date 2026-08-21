'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LANGS, translate } from '../lib/i18n';

const I18nContext = createContext({ lang: 'ko', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('ko');

  useEffect(() => {
    const saved = window.localStorage.getItem('gp_lang');
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
    window.localStorage.setItem('gp_lang', l);
  };

  const t = (key) => translate(lang, key);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
