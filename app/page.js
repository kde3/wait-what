'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../components/I18nProvider';
import TopBar from '../components/TopBar';
import { sfx } from '../lib/sound';

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
  const [publicRooms, setPublicRooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    setNickname(window.localStorage.getItem('gp_nickname') ?? '');
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchRooms();
    const timer = setInterval(fetchRooms, 4000);
    return () => clearInterval(timer);
  }, [fetchRooms]);

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

  async function joinRoom(codeArg) {
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
      <main className="container">
        <h1 className="title">{t('appName')}</h1>
        <p className="subtitle">{t('tagline')}</p>

        <div className="card">
          <label className="label">{t('nickname')}</label>
          <input
            type="text"
            maxLength={12}
            placeholder={t('nicknamePlaceholder')}
            value={nickname}
            onChange={(e) => saveNickname(e.target.value)}
          />
          <div className="btn-row">
            <button onClick={() => setShowCreate(true)} disabled={busy}>
              ➕ {t('createRoomBtn')}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>{t('joinByCode')}</h2>
          <div className="prompt-row">
            <input
              type="text"
              maxLength={4}
              placeholder={t('codePlaceholder')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button className="inline-btn" onClick={() => joinRoom()} disabled={busy}>
              {t('join')}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>🌐 {t('publicRooms')}</h2>
          {publicRooms.length === 0 ? (
            <p className="hint">{t('noPublicRooms')}</p>
          ) : (
            <ul className="room-list">
              {publicRooms.map((r) => (
                <li key={r.code}>
                  <div className="room-list-info">
                    <b>{r.name}</b>
                    <span className="hint-inline">
                      {t(MODE_KEY[r.mode])} · {r.players}/10 ·{' '}
                      {r.status === 'lobby' ? t('statusLobby') : r.status === 'playing' ? t('statusPlaying') : t('statusFinished')}
                    </span>
                  </div>
                  <button
                    className="inline-btn"
                    onClick={() => joinRoom(r.code)}
                    disabled={busy || r.status !== 'lobby'}
                  >
                    {t('join')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        {showCreate && (
          <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t('createRoomTitle')}</h2>
              <label className="label">{t('roomName')}</label>
              <input
                type="text"
                maxLength={30}
                placeholder={t('roomNamePlaceholder')}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <div className="visibility-row">
                <button
                  className={`chip ${isPublic ? 'selected' : ''}`}
                  onClick={() => setIsPublic(true)}
                  type="button"
                >
                  🌐 {t('publicRoom')}
                </button>
                <button
                  className={`chip ${!isPublic ? 'selected' : ''}`}
                  onClick={() => setIsPublic(false)}
                  type="button"
                >
                  🔒 {t('privateRoom')}
                </button>
              </div>
              <p className="hint-left">{t('publicRoomHint')}</p>
              <div className="btn-row">
                <button className="secondary" onClick={() => setShowCreate(false)}>
                  {t('cancel')}
                </button>
                <button onClick={createRoom} disabled={busy}>
                  {t('create')}
                </button>
              </div>
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
