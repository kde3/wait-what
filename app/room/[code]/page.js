'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';

const ROUND_LABEL = { phrase: '제시어 작성 ✏️', draw: '그림 그리기 🎨', guess: '제시어 맞히기 🔍' };

export default function Room({ params }) {
  const { code } = use(params);
  const [playerId, setPlayerId] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const lastRoundRef = useRef(0);

  useEffect(() => {
    setPlayerId(sessionStorage.getItem(`gp_player_${code}`));
    setCheckedStorage(true);
  }, [code]);

  const fetchState = useCallback(async () => {
    const pid = sessionStorage.getItem(`gp_player_${code}`) ?? '';
    const res = await fetch(`/api/rooms/${code}/state?playerId=${pid}`);
    if (!res.ok) {
      setError('방을 찾을 수 없습니다. 서버가 재시작되었을 수 있어요.');
      return;
    }
    const data = await res.json();
    setState(data);
    if (data.round) {
      setRemaining(data.round.remaining);
      // 라운드가 바뀌면 입력창 초기화 (같은 라운드면 입력 중인 내용 유지)
      if (data.round.number !== lastRoundRef.current) {
        lastRoundRef.current = data.round.number;
        setText('');
        setPrompt(data.round.draft?.prompt ?? '');
        setImageUrl(data.round.draft?.url ?? null);
        setError('');
      }
    }
  }, [code]);

  useEffect(() => {
    if (!checkedStorage || !playerId) return;
    fetchState();
    const t = setInterval(fetchState, 2000);
    return () => clearInterval(t);
  }, [checkedStorage, playerId, fetchState]);

  // 폴링 사이에도 초 단위로 타이머를 줄여서 표시
  useEffect(() => {
    if (remaining == null || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [remaining != null]);

  async function api(path, body) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/rooms/${code}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? '요청에 실패했습니다.');
      return null;
    }
    return data;
  }

  async function join() {
    if (!nickname.trim()) return setError('닉네임을 입력하세요.');
    const data = await api('join', { nickname });
    if (data) {
      sessionStorage.setItem(`gp_player_${code}`, data.playerId);
      setPlayerId(data.playerId);
    }
  }

  async function start() {
    if (await api('start', { playerId })) fetchState();
  }

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    const data = await api('generate', { playerId, prompt, round: state.round.number });
    setGenerating(false);
    if (data) setImageUrl(data.url);
  }

  async function submit() {
    const body = { playerId, round: state.round.number };
    if (state.round.task.kind !== 'draw') body.text = text;
    if (await api('submit', body)) fetchState();
  }

  async function unsubmit() {
    if (await api('unsubmit', { playerId, round: state.round.number })) fetchState();
  }

  if (!checkedStorage) return null;

  // 링크로 처음 들어온 사람: 닉네임 입력 후 입장
  if (!playerId) {
    return (
      <main className="container">
        <h1 className="title">AI 갈틱폰</h1>
        <p className="subtitle">
          방 <b>{code}</b>에 입장합니다
        </p>
        <div className="card">
          <label className="label">닉네임</label>
          <input
            type="text"
            maxLength={12}
            placeholder="닉네임 입력"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && join()}
          />
          <button onClick={join} disabled={busy}>
            입장하기
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="container">
        <div className="waiting">
          <div className="spinner" />
          불러오는 중...
          {error && <p className="error">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="title">AI 갈틱폰</h1>

      {state.status === 'lobby' && (
        <>
          <p className="subtitle">친구들에게 코드를 공유하세요</p>
          <div className="card">
            <div className="room-code">{state.code}</div>
            <p className="hint">이 페이지 주소를 그대로 공유해도 돼요</p>
          </div>
          <div className="card">
            <h2>참가자 ({state.players.length}명)</h2>
            <ul className="player-list">
              {state.players.map((p, i) => (
                <li key={i} className={p.isHost ? 'host' : ''}>
                  {p.nickname}
                  {p.nickname === state.you?.nickname && ' (나)'}
                </li>
              ))}
            </ul>
            {state.you?.isHost ? (
              <button onClick={start} disabled={busy}>
                게임 시작
              </button>
            ) : (
              <p className="hint">방장이 시작하기를 기다리는 중...</p>
            )}
            {error && <p className="error">{error}</p>}
          </div>
        </>
      )}

      {state.status === 'playing' && state.round && (
        <>
          <div className="round-header">
            <span>
              {state.round.number} / {state.round.total} 라운드 · {ROUND_LABEL[state.round.task?.kind] ?? ''}
            </span>
            <span className={`timer ${remaining <= 10 ? 'low' : ''}`}>⏱ {remaining ?? '-'}초</span>
          </div>

          <ul className="player-list status-list">
            {state.round.players.map((p, i) => (
              <li key={i} className={p.submitted ? 'done' : ''}>
                {p.submitted ? '✅' : '⏳'} {p.nickname}
              </li>
            ))}
          </ul>

          {state.round.submitted ? (
            <div className="card waiting">
              <div className="spinner" />
              <p>
                <b>제출 완료!</b> 다른 참가자를 기다리는 중...
              </p>
              <p className="hint">모두 제출하면 바로 다음 라운드로 넘어가요</p>
              <button className="secondary" onClick={unsubmit} disabled={busy} style={{ marginTop: 16 }}>
                제출 취소하고 수정하기
              </button>
              {error && <p className="error">{error}</p>}
            </div>
          ) : (
            <div className="card">
              {state.round.task?.kind === 'phrase' && (
                <>
                  <h2>첫 제시어를 입력하세요</h2>
                  <p className="hint-left">이 제시어는 다른 사람에게 전달되어 AI 그림이 됩니다.</p>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="예: 우주복을 입은 고양이가 라면을 먹는 모습"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                  />
                  <button onClick={submit} disabled={busy || !text.trim()}>
                    제출
                  </button>
                </>
              )}

              {state.round.task?.kind === 'draw' && (
                <>
                  <h2>이 제시어를 그림으로!</h2>
                  <div className="source-text">“{state.round.task.sourceText}”</div>
                  <p className="hint-left">
                    프롬프트를 써서 AI에게 그림을 시키세요. 마음에 들 때까지 다시 생성할 수 있어요.
                  </p>
                  {imageUrl && <img className="game-image" src={imageUrl} alt="생성된 AI 그림" />}
                  {generating && (
                    <div className="waiting">
                      <div className="spinner" />
                      AI가 그림을 그리는 중... 🎨
                    </div>
                  )}
                  <input
                    type="text"
                    maxLength={300}
                    placeholder="이미지 생성 프롬프트 입력"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generate()}
                    disabled={generating}
                  />
                  <div className="btn-row">
                    <button className="secondary" onClick={generate} disabled={generating || busy || !prompt.trim()}>
                      {imageUrl ? '다시 생성' : '이미지 생성'}
                    </button>
                    <button onClick={submit} disabled={busy || generating || !imageUrl}>
                      이 그림으로 제출
                    </button>
                  </div>
                </>
              )}

              {state.round.task?.kind === 'guess' && (
                <>
                  <h2>이 그림, 뭘까요?</h2>
                  {state.round.task.sourceImage ? (
                    <img className="game-image" src={state.round.task.sourceImage} alt="이전 사람의 AI 그림" />
                  ) : (
                    <p className="hint">앗, 이전 사람이 그림을 제출하지 않았어요. 상상해서 써보세요!</p>
                  )}
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="그림을 설명하는 제시어를 입력하세요"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                  />
                  <button onClick={submit} disabled={busy || !text.trim()}>
                    제출
                  </button>
                </>
              )}
              {error && <p className="error">{error}</p>}
            </div>
          )}
        </>
      )}

      {state.status === 'finished' && (
        <>
          <p className="subtitle">🎉 릴레이 결과 공개!</p>
          {state.albums.map((album, ai) => (
            <div key={ai} className="card">
              <h2>📖 {album.owner}님의 앨범</h2>
              {album.entries.map((item, i) => (
                <div key={i} className="album-item">
                  <div className="album-author">
                    {item.author} {item.type === 'text' ? '님의 제시어' : '님이 AI로 그린 그림'}
                    {i === 0 && <span className="badge">원본 제시어</span>}
                  </div>
                  {item.type === 'text' ? (
                    <div className={`album-text ${i === 0 ? 'album-origin' : ''}`}>{item.text}</div>
                  ) : item.url ? (
                    <>
                      <img className="game-image" src={item.url} alt={`${item.author}의 AI 그림`} />
                      {item.prompt && <p className="hint-left">프롬프트: {item.prompt}</p>}
                    </>
                  ) : (
                    <div className="album-text">(그림 미제출)</div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <a href="/">
            <button className="secondary">새 게임 하러 가기</button>
          </a>
        </>
      )}
    </main>
  );
}
