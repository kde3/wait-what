import { describe, expect, it } from 'vitest';
import { DICTS, LANGS, aiComment, translate } from '../lib/i18n';

describe('i18n 사전', () => {
  it('LANGS의 모든 언어에 사전이 있다', () => {
    for (const lang of LANGS) expect(DICTS[lang], lang).toBeDefined();
  });

  it('모든 언어 사전이 ko와 같은 키 집합을 가진다', () => {
    const koKeys = Object.keys(DICTS.ko).sort();
    for (const lang of LANGS) {
      const keys = Object.keys(DICTS[lang]).sort();
      const missing = koKeys.filter((key) => !keys.includes(key));
      const extra = keys.filter((key) => !koKeys.includes(key));
      expect({ lang, missing, extra }).toEqual({ lang, missing: [], extra: [] });
    }
  });

  it('빈 번역 값이 없다', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTS[lang])) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect((value as string).length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('translate는 없는 언어면 en, 없는 키면 키 자체로 폴백한다', () => {
    expect(translate('ko', 'appName')).toBe(DICTS.ko.appName);
    expect(translate('xx', 'appName')).toBe(DICTS.en.appName);
    expect(translate('ko', 'noSuchKey')).toBe('noSuchKey');
  });

  it('aiComment는 점수 구간별 코멘트를 준다', () => {
    expect(aiComment('ko', 60)).toBe(DICTS.ko.aiC1);
    expect(aiComment('ko', 71)).toBe(DICTS.ko.aiC2);
    expect(aiComment('ko', 86)).toBe(DICTS.ko.aiC3);
    expect(aiComment('ko', 96)).toBe(DICTS.ko.aiC4);
  });
});
