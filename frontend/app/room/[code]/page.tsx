'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../components/i18n-provider';
import Header from '../../../components/layout/header';
import { RoomView } from '../../../views/room-view';
import { useRoomState } from '../../../hooks/use-realtime';
import { playBgm, sfx, stopBgm } from '../../../lib/sound';
import { apiUrl } from '../../../lib/backend-url';
import { Input, Label, TextField, toast } from '@heroui/react';
import { Button } from '../../../components/ui/button';
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
  const [password, setPassword] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const prevPhaseRef = useRef('');
  const prevStatusRef = useRef('');

  useEffect(() => {
    setPlayerId(sessionStorage.getItem(`gp_player_${code}`));
    window.localStorage.removeItem('gp_nickname');
    setNickname(window.sessionStorage.getItem('gp_nickname') ?? '');
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

  async function join(nicknameValue = nickname) {
    const cleanNickname = nicknameValue.trim();
    if (!cleanNickname) return setError(t('errNickname'));
    setNickname(cleanNickname);
    window.sessionStorage.setItem('gp_nickname', cleanNickname);
    // 비번방인데 아직 비밀번호를 안 받았으면 입장을 시도하지 않는다.
    // 그냥 보내면 "비밀번호가 틀렸다"만 뜨고 입력할 자리가 없다.
    if (needsPassword && !password) return;
    const data = await api('join', { nickname: cleanNickname, password });
    if (data) {
      sessionStorage.setItem(`gp_player_${code}`, data.playerId);
      setPlayerId(data.playerId);
      sfx.pop();
    }
  }

  if (!checkedStorage) return null;

  const dropped = !!state && !state.you;

  if (gone || disconnected || dropped) {
    const goHome = () => {
      if (dropped) sessionStorage.removeItem(`gp_player_${code}`);
      router.push('/');
    };
    const title = gone ? t('roomGoneTitle') : disconnected ? t('disconnectedTitle') : t('droppedTitle');
    const message = gone ? t('errRoomNotFound') : disconnected ? t('errDisconnected') : t('errDropped');
    return (
      <>
        <Header onBack={goHome} />
        <ExitModal isOpen title={title} message={message} onGoHome={goHome} />
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
        <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
          <h1 className="text-center text-3xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-center text-sm text-muted">
            {t('roomCodeLabel')}: <b>{code}</b>
          </p>
          {nickname && (
            <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
              <p className="mb-3 text-center text-sm text-muted">{nickname}</p>
              {needsPassword && (
                <TextField fullWidth name="roomPassword" type="password">
                  <Label>{t('roomPassword')}</Label>
                  <Input
                    autoFocus
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-bwignore
                    type="password"
                    maxLength={32}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && join()}
                  />
                </TextField>
              )}
              <Button className="w-full" onClick={() => join()} isDisabled={busy || !infoLoaded}>
              {t('join')}
              </Button>
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
            </div>
          )}
        </main>
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Header onBack={() => router.push('/')} />
        <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
          <div className="py-8 text-center text-sm text-muted">
            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
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
        sessionStorage.removeItem(`gp_player_${code}`);
        router.push('/');
      }}
      onStarted={fetchState}
    />
  );
}


