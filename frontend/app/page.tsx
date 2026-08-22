'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../components/I18nProvider';
import TopBar from '../components/TopBar';
import { useLobbyRooms } from '../components/useRealtime';
import { sfx } from '../lib/sound';
import { Button, Card, Input, Modal } from '@heroui/react';

const MODE_KEY = {
  classic: 'modeClassic',
  speed: 'modeSpeed',
  speed_team: 'modeSpeedTeam',
  relay: 'modeRelay',
  coop: 'modeCoop',
  imposter: 'modeImposter',
};

export default function Home() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { rooms: publicRooms } = useLobbyRooms(); // 웹소켓 푸시, 실패 시 폴링 폴백
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    setNickname(window.localStorage.getItem('gp_nickname') ?? '');
  }, []);

  function saveNickname(v) {
    setNickname(v);
    window.localStorage.setItem('gp_nickname', v);
  }

  function requireNickname() {
    if (!nickname.trim()) {
      setError(t('errNickname'));
      return false;
    }
    return true;
  }

  async function createRoom() {
    if (!requireNickname()) return;
    setBusy(true);
    setError('');
    sfx.click();
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, roomName, isPublic, lang }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(t(data.error ?? 'errRequest'));
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  async function joinRoom(codeArg?: unknown) {
    const code = String(codeArg ?? joinCode).trim().toUpperCase();
    if (!requireNickname()) return;
    if (!code) return setError(t('errCode'));
    setBusy(true);
    setError('');
    sfx.click();
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(t(data.error ?? 'errRequest'));
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  return (
    <>
      <TopBar />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col gap-4 px-4 py-8">
        <section className="space-y-3 py-8 text-center">
          <div className="hidden">✦</div>
          <div className="hidden">●</div>
          <div className="mx-auto grid size-20 place-items-center rounded-2xl border bg-surface-secondary text-lg font-bold shadow-sm"><span>•‿•</span></div>
          <h1 className="text-center text-3xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-center text-sm text-muted">{t('tagline')}</p>
        </section>

        <Card className="p-5">
          <label className="mb-2 block text-sm font-medium">{t('nickname')}</label>
          <Input
            type="text"
            maxLength={12}
            placeholder={t('nicknamePlaceholder')}
            value={nickname}
            onChange={(e) => saveNickname(e.target.value)}
          />
          <div className="flex gap-2 [&>*]:flex-1">
            <Button onClick={() => setShowCreate(true)} isDisabled={busy}>
              ➕ {t('createRoomBtn')}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2>{t('joinByCode')}</h2>
          <div className="flex items-start gap-2">
            <Input
              type="text"
              maxLength={4}
              placeholder={t('codePlaceholder')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            />
            <Button className="w-auto shrink-0" onClick={() => joinRoom()} isDisabled={busy}>
              {t('join')}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2>🌐 {t('publicRooms')}</h2>
          {publicRooms.length === 0 ? (
            <p className="text-center text-sm text-muted">{t('noPublicRooms')}</p>
          ) : (
            <ul className="space-y-2">
              {publicRooms.map((r) => (
                <li key={r.code}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <b>{r.name}</b>
                    <span className="text-xs text-muted">
                      {t(MODE_KEY[r.mode])} · {r.players}/10 ·{' '}
                      {r.status === 'lobby' ? t('statusLobby') : r.status === 'playing' ? t('statusPlaying') : t('statusFinished')}
                    </span>
                  </div>
                  <Button
                    className="w-auto shrink-0"
                    onClick={() => joinRoom(r.code)}
                    isDisabled={busy || r.status !== 'lobby'}
                  >
                    {t('join')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

        <Modal>
          <Modal.Backdrop isOpen={showCreate} onOpenChange={setShowCreate} variant="blur">
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header><Modal.Heading>{t('createRoomTitle')}</Modal.Heading></Modal.Header>
              <Modal.Body>
              <label className="mb-2 block text-sm font-medium">{t('roomName')}</label>
              <Input
                type="text"
                maxLength={30}
                placeholder={t('roomNamePlaceholder')}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isPublic ? 'primary' : 'outline'}
                  onClick={() => setIsPublic(true)}
                  type="button"
                >
                  🌐 {t('publicRoom')}
                </Button>
                <Button
                  variant={!isPublic ? 'primary' : 'outline'}
                  onClick={() => setIsPublic(false)}
                  type="button"
                >
                  🔒 {t('privateRoom')}
                </Button>
              </div>
              <p className="text-sm text-muted">{t('publicRoomHint')}</p>
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowCreate(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={createRoom} isDisabled={busy}>
                  {t('create')}
                </Button>
              </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </main>
    </>
  );
}



