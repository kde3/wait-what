'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../components/i18n-provider';
import TopBar from '../../../components/layout/top-bar';
import { RoomPageView } from '../../../components/pages/room-page-view';
import { useRoomState } from '../../../hooks/use-realtime';
import { playBgm, sfx, stopBgm } from '../../../lib/sound';
import { apiUrl } from '../../../lib/backend-url';
import { Button, Input, Label, TextField, toast } from '@heroui/react';
import { ProfileSetup } from '../../../components/ui/profile-setup';

export default function Room({ params }: any) {
  const router = useRouter();
  const { code } = use(params as Promise<{ code: string }>);
  const { t } = useI18n();
  const [playerId, setPlayerId] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const prevPhaseRef = useRef('');
  const prevStatusRef = useRef('');

  useEffect(() => {
    setPlayerId(sessionStorage.getItem(`gp_player_${code}`));
    window.localStorage.removeItem('gp_nickname');
    setNickname(window.sessionStorage.getItem('gp_nickname') ?? '');
    setCheckedStorage(true);
  }, [code]);

  // 웹소켓으로 상태를 받고, 연결이 끊기면 훅이 알아서 폴링으로 버틴다.
  const { state, live, gone, refresh: fetchState } = useRoomState(code, playerId, checkedStorage && !!playerId);

  useEffect(() => {
    if (gone) toast.danger(t('errRoomNotFound'), { timeout: 5000 });
  }, [gone, t]);

  // 상태 전환 효과음 + 배경음악
  useEffect(() => {
    if (!state) return;
    const phaseKey = state.status === 'playing' && state.game
      ? `${state.game.round ?? state.game.turnIndex ?? 0}:${state.game.phase ?? state.game.task?.kind ?? ''}`
      : '';
    if (state.status === 'lobby') {
      playBgm('lobby');
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
    const data = await api('join', { nickname: cleanNickname, password });
    if (data) {
      sessionStorage.setItem(`gp_player_${code}`, data.playerId);
      setPlayerId(data.playerId);
      sfx.pop();
    }
  }

  if (!checkedStorage) return null;

  if (!playerId) {
    if (!nickname) {
      return (
        <>
          <TopBar onBack={() => router.push('/')} />
          <ProfileSetup initialValue={nickname} isBusy={busy} onSubmit={join} />
        </>
      );
    }

    return (
      <>
        <TopBar onBack={() => router.push('/')} />
        <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
          <h1 className="text-center text-3xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-center text-sm text-muted">
            {t('roomCodeLabel')}: <b>{code}</b>
          </p>
          {nickname && (
            <div className="rounded-xl border bg-surface p-5 text-foreground shadow-sm">
              <p className="mb-3 text-center text-sm text-muted">{nickname}</p>
              <TextField fullWidth name="roomPassword" type="password">
                <Label>{t('roomPassword')}</Label>
                <Input type="password" maxLength={32} placeholder={t('roomPasswordOptional')} value={password} onChange={(event) => setPassword(event.target.value)} />
              </TextField>
              <Button className="w-full" onClick={() => join()} isDisabled={busy}>
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
        <TopBar onBack={() => router.push('/')} />
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
    <RoomPageView
      state={state}
      playerId={playerId}
      api={api}
      busy={busy}
      error={error}
      live={live}
      onBack={() => router.push('/')}
      onStarted={fetchState}
    />
  );
}


