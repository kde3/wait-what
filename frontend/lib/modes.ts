import type { GameMode } from '../types/room';

export const MODE_LABEL_KEY: Record<GameMode, string> = {
  classic: 'modeClassic',
  speed: 'modeSpeed',
  speed_team: 'modeSpeedTeam',
  coop: 'modeCoop',
  chaos: 'modeChaos',
  imposter: 'modeImposter',
};

export const VISIBLE_MODES: GameMode[] = ['classic', 'speed', 'chaos', 'imposter'];

export function modeLabelKey(mode: GameMode) {
  return MODE_LABEL_KEY[mode] ?? 'modeClassic';
}
