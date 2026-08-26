import { describe, expect, it } from 'vitest';
import { CHAOS_CHARACTERS, CHAOS_CHARACTER_BY_ID } from '../lib/chaos';

describe('카오스 캐릭터 데이터', () => {
  it('7개 시스템 캐릭터와 효과 타입을 중앙 데이터에서 제공한다', () => {
    expect(CHAOS_CHARACTERS.map((character) => character.id)).toEqual([
      '404',
      'glitch',
      'pixel',
      'filter',
      'retry',
      'timeout',
      'null',
    ]);
    expect(new Set(CHAOS_CHARACTERS.map((character) => character.effectType))).toEqual(
      new Set(['crop', 'shuffle', 'pixel', 'filter', 'generation_limit', 'time_half', 'random']),
    );
  });

  it('모든 캐릭터가 표시·향후 에셋 연결 메타데이터를 가진다', () => {
    for (const character of CHAOS_CHARACTERS) {
      expect(CHAOS_CHARACTER_BY_ID[character.id]).toBe(character);
      expect(character.nameKey).toBeTruthy();
      expect(character.descriptionKey).toBeTruthy();
      expect(character.systemMessageKey).toBeTruthy();
      expect(character).toHaveProperty('image');
      expect(character).toHaveProperty('icon');
      expect(character.image).toBe(`/images/characters/${character.id === '404' ? character.id : character.id.toUpperCase()}.png`);
    }
  });
});
