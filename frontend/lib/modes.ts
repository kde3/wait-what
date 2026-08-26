import type { GameMode } from '../types/room';

export const MODE_LABEL_KEY: Record<GameMode, string> = {
  classic: 'modeClassic',
  speed: 'modeSpeed',
  speed_team: 'modeSpeedTeam',
  coop: 'modeCoop',
  imposter: 'modeImposter',
};

export function modeLabelKey(mode: GameMode) {
  return MODE_LABEL_KEY[mode] ?? 'modeClassic';
}
