'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../components/i18n-provider';
import Header from '../../../components/layout/header';
import { RoomView } from '../../../views/room-view';
import { JoinRoomView } from '../../../views/join-room-view';
import { useRoomState } from '../../../hooks/use-realtime';
import { playBgm, sfx, stopBgm } from '../../../lib/sound';
import { apiUrl } from '../../../lib/backend-url';
import { toast } from '@heroui/react';
import { Spinner } from '../../../components/ui/spinner';
import { ProfileSetup } from '../../../views/profile-setup-view';
import { ExitModal } from '../../../components/room/exit-modal';

export default function Room({ params }: any) {
  const router = useRouter();
  const { code } = use(params as Promise<{ code: string }>);
  const { t } = useI18n();
  const [playerId, setPlayerId] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const prevPhaseRef = useRef('');
  const prevStatusRef = useRef('');

  useEffect(() => {
    setPlayerId(sessionStorage.getItem(`ww_player_${code}`));
    setNickname(window.sessionStorage.getItem('ww_nickname') ?? '');
    setCheckedStorage(true);
  }, [code]);

  // 입장 전에는 방 상태를 구독하지 않으므로, 비밀번호를 물어야 하는지만 따로 확인한다.
  useEffect(() => {
    if (!checkedStorage || playerId) return;
    let cancelled = false;
    fetch(apiUrl(`/api/rooms/${code}/info`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setRoomInfo(data);
        setInfoLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setInfoLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [checkedStorage, playerId, code]);

  const needsPassword = infoLoaded && !!roomInfo && !roomInfo.isPublic;

  // 웹소켓으로 상태를 받고, 연결이 끊기면 훅이 알아서 폴링으로 버틴다.
  const { state, live, gone, disconnected, refresh: fetchState } = useRoomState(code, playerId, checkedStorage && !!playerId);

  // 상태 전환 효과음 + 배경음악
  useEffect(() => {
    if (!state) return;
    const phaseKey = state.status === 'playing' && state.game
      ? `${state.game.round ?? state.game.turnIndex ?? 0}:${state.game.phase ?? state.game.task?.kind ?? ''}`
      : '';
    if (state.status === 'room') {
      playBgm('home');
    }
    if (state.status === 'playing') {
      playBgm('play');
      if (prevStatusRef.current === 'playing' && phaseKey !== prevPhaseRef.current) sfx.start();
    }
    if (state.status === 'finished' && prevStatusRef.current === 'playing') {
      stopBgm();
      sfx.win();
    }
    prevPhaseRef.current = phaseKey;
    prevStatusRef.current = state.status;
  }, [state]);

  const api = useCallback(
    async (path, body, options: { signal?: AbortSignal } = {}) => {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(apiUrl(`/api/rooms/${code}/${path}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: options.signal,
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) {
          const msg = t(data.error ?? 'errRequest') + (data.word ? ` "${data.word}"` : '');
          if (path === 'join') toast.danger(msg, { timeout: 5000 });
          else setError(msg);
          return null;
        }
        fetchState();
        return data;
      } catch (requestError) {
        setBusy(false);
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return null;
        setError(t('errRequest'));
        return null;
      }
    },
    [code, t, fetchState],
  );

  async function join(nicknameValue = nickname, password = '') {
    const cleanNickname = nicknameValue.trim();
    if (!cleanNickname) return setError(t('errNickname'));
    setNickname(cleanNickname);
    window.sessionStorage.setItem('ww_nickname', cleanNickname);
    // 비번방인데 아직 비밀번호를 안 받았으면 입장을 시도하지 않는다.
    // 그냥 보내면 "비밀번호가 틀렸다"만 뜨고 입력할 자리가 없다.
    if (needsPassword && !password) return;
    const data = await api('join', { nickname: cleanNickname, password });
    if (data) {
      sessionStorage.setItem(`ww_player_${code}`, data.playerId);
      setPlayerId(data.playerId);
      sfx.pop();
    }
  }

  if (!checkedStorage) return null;

  const dropped = !!state && !state.you;

  if (gone || disconnected || dropped) {
    const goHome = () => {
      if (dropped) sessionStorage.removeItem(`ww_player_${code}`);
      router.push('/');
    };
    const reason = gone ? 'gone' : disconnected ? 'disconnected' : 'dropped';
    return (
      <>
        <Header onBack={goHome} />
        <ExitModal reason={reason} onGoHome={goHome} />
      </>
    );
  }

  if (!playerId) {
    if (!nickname) {
      return (
        <>
          <Header onBack={() => router.push('/')} />
          <ProfileSetup initialValue={nickname} isBusy={busy} onSubmit={join} />
        </>
      );
    }

    return (
      <>
        <Header onBack={() => router.push('/')} />
        <JoinRoomView
          code={code}
          nickname={nickname}
          needsPassword={needsPassword}
          busy={busy || !infoLoaded}
          error={error}
          onJoin={(password) => join(nickname, password)}
        />
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Header onBack={() => router.push('/')} />
        <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
          <div className="py-8 text-center text-sm text-muted">
            <Spinner className="mx-auto mb-3 block" aria-hidden="true" />
            {t('loading')}
            {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
          </div>
        </main>
      </>
    );
  }

  return (
    <RoomView
      state={state}
      playerId={playerId}
      api={api}
      busy={busy}
      error={error}
      live={live}
      onBack={() => router.push('/')}
      onLeave={() => {
        sessionStorage.removeItem(`ww_player_${code}`);
        router.push('/');
      }}
      onStarted={fetchState}
    />
  );
}
