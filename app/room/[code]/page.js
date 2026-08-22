'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../components/I18nProvider';
import TopBar from '../../../components/TopBar';
import Lobby from '../../../components/Lobby';
import GameResults from '../../../components/GameResults';
import {
  ClassicPlay,
  SpeedPlay,
  SpeedTeamPlay,
  RelayPlay,
  CoopPlay,
  ImposterPlay,
} from '../../../components/GamePlay';
import { useRoomState } from '../../../components/useRealtime';
import { sfx, startBgm, stopBgm } from '../../../lib/sound';

const PLAY_COMPONENTS = {
  classic: ClassicPlay,
  speed: SpeedPlay,
  speed_team: SpeedTeamPlay,
  relay: RelayPlay,
  coop: CoopPlay,
  imposter: ImposterPlay,
};

export default function Room({ params }) {
  const { code } = use(params);
  const { t } = useI18n();
  const [playerId, setPlayerId] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const prevPhaseRef = useRef('');
  const prevStatusRef = useRef('');

  useEffect(() => {
    setPlayerId(sessionStorage.getItem(`gp_player_${code}`));
    setNickname(window.localStorage.getItem('gp_nickname') ?? '');
    setCheckedStorage(true);
  }, [code]);

  // 웹소켓으로 상태를 받고, 연결이 끊기면 훅이 알아서 폴링으로 버틴다.
  const { state, live, gone, refresh: fetchState } = useRoomState(code, playerId, checkedStorage && !!playerId);

  useEffect(() => {
    if (gone) setError(t('errRoomNotFound'));
  }, [gone, t]);

  // 상태 전환 효과음 + 배경음악
  useEffect(() => {
    if (!state) return;
    const phaseKey = state.status === 'playing' && state.game
      ? `${state.game.round ?? state.game.turnIndex ?? 0}:${state.game.phase ?? state.game.task?.kind ?? ''}`
      : '';
    if (state.status === 'playing') {
      startBgm();
      if (prevStatusRef.current === 'playing' && phaseKey !== prevPhaseRef.current) sfx.start();
    }
    if (state.status === 'finished' && prevStatusRef.current === 'playing') {
      stopBgm();
      sfx.win();
    }
    prevPhaseRef.current = phaseKey;
    prevStatusRef.current = state.status;
  }, [state]);

  useEffect(() => () => stopBgm(), []);

  const api = useCallback(
    async (path, body) => {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(`/api/rooms/${code}/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) {
          const msg = t(data.error ?? 'errRequest') + (data.word ? ` "${data.word}"` : '');
          setError(msg);
          return null;
        }
        fetchState();
        return data;
      } catch {
        setBusy(false);
        setError(t('errRequest'));
        return null;
      }
    },
    [code, t, fetchState],
  );

  async function join() {
    if (!nickname.trim()) return setError(t('errNickname'));
    window.localStorage.setItem('gp_nickname', nickname);
    const data = await api('join', { nickname });
    if (data) {
      sessionStorage.setItem(`gp_player_${code}`, data.playerId);
      setPlayerId(data.playerId);
      sfx.pop();
    }
  }

  if (!checkedStorage) return null;

  if (!playerId) {
    return (
      <>
        <TopBar />
        <main className="container">
          <h1 className="title">{t('appName')}</h1>
          <p className="subtitle">
            {t('roomCodeLabel')}: <b>{code}</b>
          </p>
          <div className="card">
            <label className="label">{t('nickname')}</label>
            <input
              type="text"
              maxLength={12}
              placeholder={t('nicknamePlaceholder')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button onClick={join} disabled={busy}>
              {t('join')}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        </main>
      </>
    );
  }

  if (!state) {
    return (
      <>
        <TopBar />
        <main className="container">
          <div className="waiting">
            <div className="spinner" />
            {t('loading')}
            {error && <p className="error">{error}</p>}
          </div>
        </main>
      </>
    );
  }

  const Play = PLAY_COMPONENTS[state.mode];

  return (
    <>
      <TopBar />
      <main className="container wide">
        {!live && <div className="conn-warning">{t('reconnecting')}</div>}

        {state.status === 'lobby' && (
          <Lobby state={state} playerId={playerId} api={api} busy={busy} error={error} onStarted={fetchState} />
        )}

        {state.status === 'playing' && state.game && Play && (
          <Play state={state} playerId={playerId} api={api} busy={busy} error={error} />
        )}

        {state.status === 'finished' && <GameResults state={state} />}
      </main>
    </>
  );
}
