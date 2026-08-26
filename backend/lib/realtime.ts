// 웹소켓 브로드캐스트 계층.
//
// server.js(CommonJS)는 업그레이드 처리와 소켓 등록만 맡고, 게임 로직을 아는 이 모듈이
// globalThis에 등록된 소켓을 읽어 실제 전송을 한다. 두 쪽이 같은 프로세스라 방 상태를 그대로 공유한다.
import { getRoom, advance, listPublicRooms, removePlayer, deleteRoom } from './store';
import { buildState } from './serialize';

export const HOME = '@HOME';

const TICK_MS = 250;

const sockets = () => globalThis.__gpSockets ?? (globalThis.__gpSockets = new Map());
const dirty = () => globalThis.__gpDirty ?? (globalThis.__gpDirty = new Set());

export const RECONNECT_GRACE_MS = 3_000;

const leaveTimers = () => globalThis.__gpLeaveTimers ?? (globalThis.__gpLeaveTimers = new Map());

export function hasLiveSocket(code, playerId) {
  const set = sockets().get(String(code).toUpperCase());
  if (!set) return false;
  for (const socket of set) if (socket.readyState === 1 && socket.gpPlayerId === playerId) return true;
  return false;
}

export function cancelLeave(code, playerId) {
  const key = `${String(code).toUpperCase()}:${playerId}`;
  const timer = leaveTimers().get(key);
  if (!timer) return;
  clearTimeout(timer);
  leaveTimers().delete(key);
}

export function scheduleLeave(code, playerId) {
  if (!playerId) return;
  const key = `${String(code).toUpperCase()}:${playerId}`;
  cancelLeave(code, playerId);
  const timer = setTimeout(() => {
    leaveTimers().delete(key);
    if (hasLiveSocket(code, playerId)) return;
    const room = getRoom(code);
    if (!room) return;
    if (!removePlayer(room, playerId)) return;
    if (!room.players.length) deleteRoom(room.code);
    touch(room.code);
    touch(HOME);
  }, RECONNECT_GRACE_MS);
  leaveTimers().set(key, timer);
}

// 상태를 바꾼 쪽에서 호출 — 다음 틱에 해당 채널로 밀어준다.
export function touch(code) {
  dirty().add(String(code).toUpperCase());
  ensureTicker();
}

function send(ws, data) {
  if (ws.readyState !== 1) return; // 1 = OPEN
  try {
    ws.send(data);
  } catch {}
}

export function broadcast(code) {
  const key = String(code).toUpperCase();
  const set = sockets().get(key);
  if (!set?.size) return;

  if (key === HOME) {
    const payload = JSON.stringify({ type: 'home', rooms: listPublicRooms() });
    for (const ws of set) send(ws, payload);
    return;
  }

  const room = getRoom(key);
  if (!room) {
    const payload = JSON.stringify({ type: 'gone' });
    for (const ws of set) send(ws, payload);
    return;
  }
  // 플레이어마다 공개 범위가 달라서 소켓별로 따로 만든다.
  for (const ws of set) {
    send(ws, JSON.stringify({ type: 'state', state: buildState(room, ws.gpPlayerId) }));
  }
}

// 밀어줄 필요가 있는 변화만 골라내기 위한 압축 서명.
// 남은 시간은 클라이언트가 자체 카운트다운하므로 일부러 제외한다.
function stateKey(room) {
  const g = room.game;
  const parts = [
    room.status,
    room.mode,
    room.name,
    room.isPublic ? 1 : 0,
    room.players.map((p) => `${p.nickname}:${p.team}:${p.score}:${p.staying ? 1 : 0}`).join(','),
    JSON.stringify(room.options),
    room.chat?.length,
  ];
  if (g) {
    parts.push(
      g.round,
      g.phase,
      g.turn,
      g.turnIndex,
      g.guesses?.length,
      g.entries?.length,
      g.votes?.size,
      g.caught,
      g.image ? 1 : 0,
      g.draftUrl ? 1 : 0,
      g.winnerId,
      g.teamScores?.join(','),
    );
    if (g.submissions) {
      parts.push([...g.submissions].map(([k, v]) => `${k}${v.submitted ? 1 : 0}${v.url ? 1 : 0}`).join('|'));
    }
    if (g.subs) {
      parts.push([...g.subs].map(([k, v]) => `${k}${v.submitted ? 1 : 0}${v.url ? 1 : 0}`).join('|'));
    }
    if (g.groups) {
      parts.push(g.groups.map((x) => `${x.turn}:${x.done ? 1 : 0}:${x.entries?.length ?? 0}:${x.draftUrl ? 1 : 0}:${x.score}`).join('|'));
    }
    if (g.teams) {
      parts.push(g.teams.map((t) => `${t.image ? 1 : 0}:${t.draftUrl ? 1 : 0}`).join('|'));
    }
  }
  return parts.join('~');
}

// 제한시간 만료도 접속자 없이 흘러가지 않도록 서버가 직접 돌린다.
function tick() {
  const all = sockets();
  const pending = dirty();

  for (const [code, set] of all) {
    if (!set.size) continue;

    if (code === HOME) {
      if (pending.delete(code)) broadcast(code);
      continue;
    }

    const room = getRoom(code);
    if (!room) {
      if (pending.delete(code)) broadcast(code);
      continue;
    }

    const before = stateKey(room);
    advance(room);
    const changed = stateKey(room) !== before;
    const wasDirty = pending.delete(code);
    if (changed || wasDirty) {
      broadcast(code);
      if (changed) pending.add(HOME); // 방 상태가 바뀌면 홈 목록도 갱신
    }
  }

  if (pending.has(HOME) && all.get(HOME)?.size) {
    pending.delete(HOME);
    broadcast(HOME);
  }
}

export function ensureTicker() {
  if (globalThis.__gpTicker) return;
  globalThis.__gpTicker = setInterval(tick, TICK_MS);
}

ensureTicker();
