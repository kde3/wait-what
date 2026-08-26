export const CHAOS_CHARACTERS = [
  { id: '404', effectType: 'crop' },
  { id: 'glitch', effectType: 'shuffle' },
  { id: 'pixel', effectType: 'pixel' },
  { id: 'filter', effectType: 'filter' },
  { id: 'retry', effectType: 'generation_limit' },
  { id: 'timeout', effectType: 'time_half' },
  { id: 'null', effectType: 'random' },
] as const;

export type ChaosCharacterId = (typeof CHAOS_CHARACTERS)[number]['id'];

export function randomChaosCharacterId(): ChaosCharacterId {
  return CHAOS_CHARACTERS[Math.floor(Math.random() * CHAOS_CHARACTERS.length)].id;
}

const ACTIVE_CHAOS_CHARACTERS = CHAOS_CHARACTERS.filter((character) => character.id !== 'null');

export function randomActiveChaosCharacterId(): Exclude<ChaosCharacterId, 'null'> {
  return ACTIVE_CHAOS_CHARACTERS[Math.floor(Math.random() * ACTIVE_CHAOS_CHARACTERS.length)].id;
}
