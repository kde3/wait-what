export const CHAOS_CHARACTERS = [
  { id: '404', effectType: 'crop' },
  { id: 'glitch', effectType: 'shuffle' },
  { id: 'pixel', effectType: 'zoom' },
  { id: 'filter', effectType: 'mood' },
  { id: 'autocorrect', effectType: 'noun_swap' },
  { id: 'null', effectType: 'weird' },
] as const;

export type ChaosCharacterId = (typeof CHAOS_CHARACTERS)[number]['id'];

export function randomChaosCharacterId(): ChaosCharacterId {
  return CHAOS_CHARACTERS[Math.floor(Math.random() * CHAOS_CHARACTERS.length)].id;
}
