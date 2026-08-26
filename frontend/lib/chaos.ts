export type ChaosEffectType = 'crop' | 'shuffle' | 'zoom' | 'mood' | 'noun_swap' | 'weird';

export type ChaosCharacterId = '404' | 'glitch' | 'pixel' | 'filter' | 'autocorrect' | 'null';

export type ChaosCharacterState =
  | 'idle'
  | 'confused'
  | 'happy'
  | 'shocked'
  | 'thinking'
  | 'active'
  | 'success'
  | 'failure';

export interface ChaosCharacterData {
  id: ChaosCharacterId;
  effectType: ChaosEffectType;
  nameKey: string;
  descriptionKey: string;
  systemMessageKey: string;
  image: string | null;
  icon: string | null;
  colorKey: ChaosCharacterId;
}

export const CHAOS_CHARACTERS: ChaosCharacterData[] = [
  { id: '404', effectType: 'crop', nameKey: 'chaos404Name', descriptionKey: 'chaos404Description', systemMessageKey: 'chaos404SystemMessage', image: null, icon: null, colorKey: '404' },
  { id: 'glitch', effectType: 'shuffle', nameKey: 'chaosGlitchName', descriptionKey: 'chaosGlitchDescription', systemMessageKey: 'chaosGlitchSystemMessage', image: null, icon: null, colorKey: 'glitch' },
  { id: 'pixel', effectType: 'zoom', nameKey: 'chaosPixelName', descriptionKey: 'chaosPixelDescription', systemMessageKey: 'chaosPixelSystemMessage', image: null, icon: null, colorKey: 'pixel' },
  { id: 'filter', effectType: 'mood', nameKey: 'chaosFilterName', descriptionKey: 'chaosFilterDescription', systemMessageKey: 'chaosFilterSystemMessage', image: null, icon: null, colorKey: 'filter' },
  { id: 'autocorrect', effectType: 'noun_swap', nameKey: 'chaosAutocorrectName', descriptionKey: 'chaosAutocorrectDescription', systemMessageKey: 'chaosAutocorrectSystemMessage', image: null, icon: null, colorKey: 'autocorrect' },
  { id: 'null', effectType: 'weird', nameKey: 'chaosNullName', descriptionKey: 'chaosNullDescription', systemMessageKey: 'chaosNullSystemMessage', image: null, icon: null, colorKey: 'null' },
];

export const CHAOS_CHARACTER_BY_ID = Object.fromEntries(
  CHAOS_CHARACTERS.map((character) => [character.id, character]),
) as Record<ChaosCharacterId, ChaosCharacterData>;
