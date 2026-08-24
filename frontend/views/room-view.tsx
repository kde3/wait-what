'use client';

import Header from '../components/layout/header';
import Room from '../components/room/room';
import GameResults from '../components/game/game-results';
import {
  ClassicPlay,
  SpeedPlay,
  SpeedTeamPlay,
  RelayPlay,
  CoopPlay,
  ImposterPlay,
} from '../components/game/game-play';
import { useI18n } from '../components/i18n-provider';
import type { RoomApi } from '../types/api';
import type { RoomState } from '../types/room';

const PLAY_COMPONENTS = {
  classic: ClassicPlay,
  speed: SpeedPlay,
  speed_team: SpeedTeamPlay,
  relay: RelayPlay,
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
  onStarted,
}: RoomViewProps) {
  const { t } = useI18n();
  const Play = PLAY_COMPONENTS[state.mode];

  return (
    <>
      <Header onBack={onBack} />
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6">
        {!live && <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-center text-sm text-danger">{t('reconnecting')}</div>}
        {state.status === 'room' && (
          <Room state={state} playerId={playerId} api={api} busy={busy} error={error} onStarted={onStarted} />
        )}
        {state.status === 'playing' && state.game && Play && (
          <Play state={state} playerId={playerId} api={api} busy={busy} error={error} />
        )}
        {state.status === 'finished' && <GameResults state={state} />}
      </main>
    </>
  );
}
