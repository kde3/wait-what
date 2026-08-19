'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function createRoom() {
    if (!nickname.trim()) return setError('닉네임을 입력하세요.');
    setBusy(true);
    setError('');
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? '방 생성에 실패했습니다.');
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  async function joinRoom() {
    if (!nickname.trim()) return setError('닉네임을 입력하세요.');
    if (!joinCode.trim()) return setError('초대 코드를 입력하세요.');
    setBusy(true);
    setError('');
    const code = joinCode.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error ?? '입장에 실패했습니다.');
    sessionStorage.setItem(`gp_player_${data.code}`, data.playerId);
    router.push(`/room/${data.code}`);
  }

  return (
    <main className="container">
      <h1 className="title">AI 갈틱폰</h1>
      <p className="subtitle">문장을 전하면 AI가 그림을 그려요. 릴레이로 원본을 맞혀보세요!</p>

      <div className="card">
        <label className="label">닉네임</label>
        <input
          type="text"
          maxLength={12}
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <div className="card">
        <h2>새 게임 만들기</h2>
        <button onClick={createRoom} disabled={busy}>
          방 만들기
        </button>
      </div>

      <div className="card">
        <h2>초대 코드로 입장</h2>
        <input
          type="text"
          maxLength={4}
          placeholder="예: AB12"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        <button className="secondary" onClick={joinRoom} disabled={busy}>
          입장하기
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
