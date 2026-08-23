'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../i18n-provider';
import TopBar from '../layout/top-bar';
import { useLobbyRooms } from '../../hooks/use-realtime';
import { playBgm, sfx } from '../../lib/sound';
import { apiUrl } from '../../lib/backend-url';
import { Button, Card, FieldError, Input, Label, Modal, Radio, RadioGroup, TextField, toast } from '@heroui/react';
import { ProfileSetup } from '../ui/profile-setup';

const MODE_KEY = {
  classic: 'modeClassic',
  speed: 'modeSpeed',
  speed_team: 'modeSpeedTeam',
  relay: 'modeRelay',
  coop: 'modeCoop',
  imposter: 'modeImposter',
};

const SUGGESTED_ROOM_NAMES = [
  'AI 그림 전화방',
  '그림으로 말해요',
  '엉뚱한 그림 릴레이',
  '웃음 가득 낙서방',
  '무엇이 그려질까요?',
];

export default function HomePageView() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [nickname, setNickname] = useState('');
  const [showNickname, setShowNickname] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');
  const joinCodeInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { rooms: publicRooms } = useLobbyRooms(); // 웹소켓 푸시, 실패 시 폴링 폴백
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [suggestedRoomName, setSuggestedRoomName] = useState(SUGGESTED_ROOM_NAMES[0]);
  const [roomPassword, setRoomPassword] = useState('');
  const [roomPasswordError, setRoomPasswordError] = useState('');
  const [roomVisibility, setRoomVisibility] = useState('public');

  useEffect(() => {
    window.localStorage.removeItem('gp_nickname');
    const savedNickname = window.sessionStorage.getItem('gp_nickname')?.trim() ?? '';
    setNickname(savedNickname);
    setShowNickname(!savedNickname);
    setProfileChecked(true);
    if (savedNickname) playBgm('lobby');
  }, []);

  function saveNickname(value: string) {
    setNickname(value);
    window.sessionStorage.setItem('gp_nickname', value);
    setShowNickname(false);
    playBgm('lobby');
  }

  function requireNickname() {
    if (!nickname.trim()) {
      setError(t('errNickname'));
      return false;
    }
    return true;
  }

  function openCreateRoom() {
    const nextName = SUGGESTED_ROOM_NAMES[Math.floor(Math.random() * SUGGESTED_ROOM_NAMES.length)];
    setRoomName('');
    setSuggestedRoomName(nextName);
    setShowCreate(true);
  }

  async function createRoom() {
    if (!requireNickname()) return;
    if (roomVisibility === 'private' && !roomPassword) {
      setRoomPasswordError(t('errRoomPasswordRequired'));
      return;
    }
    setBusy(true);
    setError('');
    sfx.click();
    const res = await fetch(apiUrl('/api/rooms'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        roomName: roomName.trim() || suggestedRoomName,
        password: roomVisibility === 'private' ? roomPassword : '',
        lang,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.danger(t(data.error ?? 'errRequest'), { timeout: 5000 });
      return;
    }
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  async function joinRoom(codeArg?: unknown) {
    const code = String(codeArg ?? joinCode).trim().toUpperCase();
    if (!requireNickname()) return;
    if (!code) {
      setJoinCodeError(t('errCode'));
      requestAnimationFrame(() => joinCodeInputRef.current?.focus());
      return;
    }
    setJoinCodeError('');
    setBusy(true);
    setError('');
    sfx.click();
    const res = await fetch(apiUrl(`/api/rooms/${code}/join`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.danger(t(data.error ?? 'errRequest'), { timeout: 5000 });
      return;
    }
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  if (!profileChecked) return null;

  if (showNickname) {
    return (
      <>
        <TopBar />
        <ProfileSetup initialValue={nickname} onSubmit={saveNickname} />
      </>
    );
  }

  return (
    <>
      <TopBar nickname={nickname} onBackToProfile={() => setShowNickname(true)} />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col gap-4 px-4 py-8">
        <section className="space-y-3 py-8 text-center">
          <div className="hidden">✦</div>
          <div className="hidden">●</div>
          <div className="mx-auto grid size-20 place-items-center rounded-2xl border bg-surface-secondary text-lg font-bold shadow-sm"><span>•‿•</span></div>
          <h1 className="text-center text-3xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-center text-sm text-muted">{t('tagline')}</p>
        </section>

        <Button className="w-full" onClick={openCreateRoom} isDisabled={busy}>
          ➕ {t('createRoomBtn')}
        </Button>

        <Card className="p-5">
          <div className="flex items-start gap-2">
            <TextField fullWidth isInvalid={Boolean(joinCodeError)} name="inviteCode" autoComplete="off">
              <Label>{t('joinByCode')}</Label>
              <Input
                ref={joinCodeInputRef}
                type="text"
                maxLength={4}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={t('codePlaceholder')}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  if (joinCodeError) setJoinCodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                onBlur={() => setJoinCodeError('')}
              />
              <FieldError>{joinCodeError}</FieldError>
            </TextField>
            <Button className="w-auto shrink-0" onClick={() => joinRoom()} isDisabled={busy}>
              {t('join')}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2>{t('publicRooms')}</h2>
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

        <Modal.Backdrop isOpen={showCreate} onOpenChange={setShowCreate}>
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
              <Modal.Header><Modal.Heading>{t('createRoomTitle')}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-0">
              <div className="flex flex-col gap-6">
              <RadioGroup
                value={roomVisibility}
                onChange={(value) => {
                  setRoomVisibility(value);
                  if (value === 'public') {
                    setRoomPassword('');
                    setRoomPasswordError('');
                  }
                }}
                className="grid grid-cols-2 gap-3"
                aria-label={t('roomVisibility')}
              >
                <Radio value="public">
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                  <Radio.Content>{t('publicRoom')}</Radio.Content>
                </Radio>
                <Radio value="private">
                  <Radio.Control><Radio.Indicator /></Radio.Control>
                  <Radio.Content>{t('privateRoom')}</Radio.Content>
                </Radio>
              </RadioGroup>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium">{t('roomName')}</label>
                <Input
                  type="text"
                  maxLength={30}
                  placeholder={suggestedRoomName}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              {roomVisibility === 'private' && (
                <TextField fullWidth isInvalid={Boolean(roomPasswordError)} isRequired name="roomPassword" type="password" className="gap-2">
                  <Label>{t('roomPassword')}</Label>
                  <Input
                    type="password"
                    maxLength={32}
                    placeholder={t('roomPasswordCreateHint')}
                    value={roomPassword}
                    onChange={(event) => {
                      setRoomPassword(event.target.value);
                      if (roomPasswordError) setRoomPasswordError('');
                    }}
                  />
                  <FieldError>{roomPasswordError}</FieldError>
                </TextField>
              )}
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
              </div>
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
      </main>
    </>
  );
}
