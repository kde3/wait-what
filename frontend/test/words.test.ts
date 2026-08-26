import { describe, expect, it } from 'vitest';
import { WORDS, wordText } from '../lib/words';
import { LANGS } from '../lib/langs';

describe('제시어 뱅크', () => {
  it('모든 제시어에 12개 언어 번역이 있다', () => {
    for (const word of WORDS) {
      for (const lang of LANGS) {
        expect(typeof word[lang], `${word.ko}.${lang}`).toBe('string');
        expect((word[lang] as string).length, `${word.ko}.${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it('ko 기준으로 중복 제시어가 없다', () => {
    const koWords = WORDS.map((word) => word.ko);
    expect(new Set(koWords).size).toBe(koWords.length);
  });

  it('wordText는 언어 → en → ko 순으로 폴백한다', () => {
    const word = { ko: '고양이', en: 'cat' };
    expect(wordText(word, 'en')).toBe('cat');
    expect(wordText(word, 'xx')).toBe('cat');
    expect(wordText({ ko: '고양이' }, 'en')).toBe('고양이');
    expect(wordText(null, 'ko')).toBe('');
  });
});
