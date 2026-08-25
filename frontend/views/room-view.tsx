'use client';

import Header from '../components/layout/header';
import Room from '../components/room/room';
import GameResults from '../components/game/game-results';
import ClassicPlay from '../components/game/modes/classic-play';
import SpeedPlay from '../components/game/modes/speed-play';
import SpeedTeamPlay from '../components/game/modes/speed-team-play';
import CoopPlay from '../components/game/modes/coop-play';
import ImposterPlay from '../components/game/modes/imposter-play';
import { useI18n } from '../components/i18n-provider';
import type { RoomApi } from '../types/api';
import type { RoomState } from '../types/room';

const PLAY_COMPONENTS = {
  classic: ClassicPlay,
  speed: SpeedPlay,
  speed_team: SpeedTeamPlay,
  coop: CoopPlay,
  imposter: ImposterPlay,
};

interface RoomViewProps {
  state: RoomState;
  playerId: string;
  api: RoomApi;
  busy?: boolean;
  error?: string;
  live?: boolean;
  onBack?: () => void;
  onLeave?: () => void;
  onStarted?: () => void;
}

export function RoomView({
  state,
  playerId,
  api,
  busy = false,
  error = '',
  live = true,
  onBack,
  onLeave,
  onStarted,
}: RoomViewProps) {
  const { t } = useI18n();
  const Play = PLAY_COMPONENTS[state.mode];

  return (
    <>
      <Header onBack={onBack} />
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6">
        {!live && (
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-surface-secondary px-3 py-2 text-sm text-muted">
            <span className="size-3 shrink-0 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
            {t('reconnecting')}
          </div>
        )}
        {state.status === 'room' && (
          <Room state={state} playerId={playerId} api={api} busy={busy} error={error} onStarted={onStarted} />
        )}
        {state.status === 'playing' && state.game && Play && (
          <Play state={state} playerId={playerId} api={api} busy={busy} error={error} />
        )}
        {state.status === 'finished' && <GameResults state={state} playerId={playerId} api={api} busy={busy} onLeave={onLeave} />}
      </main>
    </>
  );
}
