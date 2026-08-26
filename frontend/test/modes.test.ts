import { describe, expect, it } from 'vitest';
import { MODE_LABEL_KEY, modeLabelKey } from '../lib/modes';
import { DICTS } from '../lib/i18n';

describe('모드 라벨', () => {
  it('모든 모드의 라벨·설명 키가 사전에 있다', () => {
    for (const key of Object.values(MODE_LABEL_KEY)) {
      expect(DICTS.ko[key], key).toBeDefined();
      expect(DICTS.ko[`${key}Desc`], `${key}Desc`).toBeDefined();
    }
  });

  it('모르는 모드는 클래식으로 폴백한다', () => {
    expect(modeLabelKey('unknown' as never)).toBe('modeClassic');
  });
});
