// 인메모리 게임 상태 저장소 (MVP용 — 서버 재시작 시 초기화됨)
import { createHash } from 'node:crypto';
import { WORDS } from './words';
import { LANGS } from './langs';

const rooms = globalThis.__gpRooms ?? (globalThis.__gpRooms = new Map());

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const REVEAL_MS = 6000; // 라운드 결과 공개 시간
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_CLASSIC_PHRASE = '우주복을 입은 고양이가 라면을 먹는 모습';
const hashPassword = (password) => createHash('sha256').update(String(password)).digest('hex');

export const MODES = ['classic', 'speed', 'speed_team', 'relay', 'coop', 'imposter'];

export const DEFAULT_OPTIONS = {
  textSeconds: 45, // 제시어 작성/맞히기 제한시간
  imageSeconds: 90, // 그림(프롬프트+생성) 제한시간
  rounds: 5, // 스피드 퀴즈 라운드 수
  teamMode: false, // 개인전/팀전 (speed, relay, coop)
  fixedDrawer: false, // 스피드 퀴즈: 고정된 대표 한 명(방장)이 계속 그림
  scored: true, // relay/coop: AI 평가 여부
  moderator: false, // imposter: 사회자(방장 관전) 여부
};

function randomCode(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeText(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function pickWord(used) {
  const pool = WORDS.filter((w) => !used.includes(w.ko));
  const src = pool.length ? pool : WORDS;
  return src[Math.floor(Math.random() * src.length)];
}

export function wordMatches(word, guess) {
  const g = normalizeText(guess);
  if (!g || !word) return false;
  return Object.values(word).some((v) => normalizeText(v) === g);
}

// 비밀 키워드가 있는 모드에서는 키워드 자체가 프롬프트에 포함되면 반려
export function promptViolation(room, prompt, keyword) {
  const p = normalizeText(prompt);
  if (keyword) {
    for (const raw of Object.values(keyword)) {
      const v = normalizeText(raw);
      if (v && p.includes(v)) return raw;
    }
  }
  return null;
}

// 목업 AI 점수 — 시드 문자열로 결정적 산출 (실제 평가 API 연동 지점)
export function mockAiScore(seed) {
  let h = 7;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 99991;
  return 60 + (h % 41); // 60 ~ 100
}

// ── 방 관리 ─────────────────────────────────────────────

export function createRoom(nickname, { name, password, lang }: Record<string, any> = {}) {
  pruneRooms();
  let code;
  do {
    code = randomCode();
  } while (rooms.has(code));

  const hostId = randomId();
  const cleanPassword = String(password ?? '').slice(0, 32);
  const room = {
    code,
    name: String(name ?? '').trim().slice(0, 30) || `${nickname}`,
    isPublic: !cleanPassword,
    passwordHash: cleanPassword ? hashPassword(cleanPassword) : '',
    lang: LANGS.includes(lang) ? lang : 'ko',
    status: 'lobby', // lobby | playing | finished
    mode: 'classic',
    options: { ...DEFAULT_OPTIONS },
    players: [{ id: hostId, nickname, isHost: true, team: null, score: 0 }],
    game: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return { room, playerId: hostId };
}

function pruneRooms() {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}

export function getRoom(code) {
  return rooms.get(String(code).toUpperCase()) ?? null;
}

export function deleteRoom(code) {
  return rooms.delete(String(code).toUpperCase());
}

export function listPublicRooms(activePlayerCounts: Map<string, number>) {
  pruneRooms();
  return [...rooms.values()]
    .filter((r) => r.isPublic && (activePlayerCounts.get(r.code) ?? 0) > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 30)
    .map((r) => ({
      code: r.code,
      name: r.name,
      mode: r.mode,
      status: r.status,
      players: activePlayerCounts.get(r.code) ?? 0,
    }));
}

export function joinRoom(code, nickname, password = '') {
  const room = getRoom(code);
  if (!room) return { error: 'errRoomNotFound' };
  if (room.passwordHash && room.passwordHash !== hashPassword(password ?? '')) return { error: 'errWrongPassword' };
  if (room.status !== 'lobby') return { error: 'errAlreadyStarted' };
  if (room.players.length >= 10) return { error: 'errRoomFull' };

  const playerId = randomId();
  const team = isTeamGame(room) ? smallerTeam(room) : null;
  room.players.push({ id: playerId, nickname, isHost: false, team, score: 0 });
  return { room, playerId };
}

export function isTeamGame(room) {
  return (
    room.mode === 'speed_team' ||
    (['speed', 'relay', 'coop'].includes(room.mode) && room.options.teamMode)
  );
}

function smallerTeam(room) {
  const c = [0, 0];
  for (const p of room.players) if (p.team === 0 || p.team === 1) c[p.team]++;
  return c[0] <= c[1] ? 0 : 1;
}

function ensureTeams(room) {
  room.players.forEach((p, i) => {
    if (p.team !== 0 && p.team !== 1) p.team = i % 2;
  });
}

export function configRoom(room, playerId, patch: Record<string, any> = {}) {
  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return { error: 'errHostOnly' };
  if (room.status !== 'lobby') return { error: 'errAlreadyStarted' };

  if (patch.mode !== undefined) {
    if (!MODES.includes(patch.mode)) return { error: 'errBadMode' };
    room.mode = patch.mode;
  }
  if (patch.name !== undefined) room.name = String(patch.name).trim().slice(0, 30) || room.name;
  if (patch.isPublic !== undefined) room.isPublic = !!patch.isPublic;
  if (patch.lang !== undefined && LANGS.includes(patch.lang)) room.lang = patch.lang;

  if (patch.options && typeof patch.options === 'object') {
    const o = patch.options;
    const opt = room.options;
    if (o.textSeconds !== undefined) opt.textSeconds = clampInt(o.textSeconds, 15, 300, opt.textSeconds);
    if (o.imageSeconds !== undefined) opt.imageSeconds = clampInt(o.imageSeconds, 30, 600, opt.imageSeconds);
    if (o.rounds !== undefined) opt.rounds = clampInt(o.rounds, 1, 20, opt.rounds);
    if (o.teamMode !== undefined) opt.teamMode = !!o.teamMode;
    if (o.fixedDrawer !== undefined) opt.fixedDrawer = !!o.fixedDrawer;
    if (o.scored !== undefined) opt.scored = !!o.scored;
    if (o.moderator !== undefined) opt.moderator = !!o.moderator;
  }

  if (isTeamGame(room)) ensureTeams(room);
  return {};
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function setTeam(room, playerId, team) {
  if (room.status !== 'lobby') return { error: 'errAlreadyStarted' };
  if (!isTeamGame(room)) return { error: 'errNotTeamGame' };
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: 'errNotPlayer' };
  if (team !== 0 && team !== 1) return { error: 'errBadTeam' };
  player.team = team;
  return {};
}

// ── 게임 시작 ────────────────────────────────────────────

export function startGame(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  if (!player?.isHost) return { error: 'errHostOnly' };
  if (room.status !== 'lobby') return { error: 'errAlreadyStarted' };

  const n = room.players.length;
  const min = { classic: 1, speed: 2, speed_team: 2, relay: 1, coop: 1, imposter: 3 }[room.mode];
  const minTotal = room.mode === 'imposter' && room.options.moderator ? 4 : min;
  if (n < minTotal) return { error: 'errNotEnoughPlayers' };

  if (isTeamGame(room)) {
    ensureTeams(room);
    const c = [0, 0];
    for (const p of room.players) c[p.team]++;
    if (c[0] < 1 || c[1] < 1) return { error: 'errTeamEmpty' };
  }

  for (const p of room.players) p.score = 0;

  const init = { classic: initClassic, speed: initSpeed, speed_team: initSpeedTeam, relay: initRelay, coop: initCoop, imposter: initImposter };
  room.game = init[room.mode](room);
  room.status = 'playing';
  return {};
}

export function advance(room) {
  if (room.status !== 'playing') return;
  const adv = { classic: advClassic, speed: advSpeed, speed_team: advSpeedTeam, relay: advRelay, coop: advCoop, imposter: advImposter };
  adv[room.mode](room);
}

const now = () => Date.now();

// ── 클래식: 제시어 → 그림 → 제시어 릴레이 ──────────────────

function initClassic(room) {
  const order = shuffle(room.players.map((p) => p.id));
  return {
    order,
    chains: order.map(() => []),
    round: 0,
    totalRounds: order.length === 1 ? 2 : order.length,
    submissions: new Map(),
    endsAt: now() + room.options.textSeconds * 1000,
  };
}

export function classicRoundType(round) {
  return round % 2 === 0 ? 'text' : 'image';
}

export function classicChainIndex(room, playerId) {
  const g = room.game;
  const nLen = g.order.length;
  const k = g.order.indexOf(playerId);
  if (k < 0) return -1;
  return (((k - g.round) % nLen) + nLen) % nLen;
}

function advClassic(room) {
  const g = room.game;
  const allSubmitted = room.players.every((p) => g.submissions.get(p.id)?.submitted);
  if (!allSubmitted && now() < g.endsAt) return;

  const type = classicRoundType(g.round);
  for (const p of room.players) {
    const j = classicChainIndex(room, p.id);
    const sub = g.submissions.get(p.id) ?? {};
    if (type === 'text') {
      const submittedText = (sub.text ?? '').trim();
      const text = submittedText || (g.round === 0 ? DEFAULT_CLASSIC_PHRASE : '');
      g.chains[j].push({ type: 'text', text, authorId: p.id, authorNickname: p.nickname });
    } else {
      g.chains[j].push({ type: 'image', url: sub.url ?? null, prompt: (sub.prompt ?? '').trim(), authorId: p.id, authorNickname: p.nickname });
    }
  }

  if (g.round + 1 >= g.totalRounds) {
    room.status = 'finished';
  } else {
    g.round += 1;
    g.submissions = new Map();
    const secs = classicRoundType(g.round) === 'image' ? room.options.imageSeconds : room.options.textSeconds;
    g.endsAt = now() + secs * 1000;
  }
}

// ── 스피드 퀴즈: 한 명이 그리고 나머지가 맞히기 ─────────────

function initSpeed(room) {
  const g = {
    order: shuffle(room.players.map((p) => p.id)),
    round: 0,
    totalRounds: room.options.rounds,
    used: [],
    history: [],
    teamScores: [0, 0],
  };
  speedNewRound(room, g);
  return g;
}

function speedNewRound(room, g) {
  g.keyword = pickWord(g.used);
  g.used.push(g.keyword.ko);
  g.drawerId = room.options.fixedDrawer
    ? room.players.find((p) => p.isHost).id
    : g.order[g.round % g.order.length];
  g.phase = 'draw'; // draw | guess | reveal
  g.draftUrl = null;
  g.draftPrompt = null;
  g.image = null;
  g.guesses = [];
  g.winnerId = null;
  g.endsAt = now() + room.options.imageSeconds * 1000;
}

function speedFinishRound(room, g, winnerId) {
  g.winnerId = winnerId ?? null;
  const winner = room.players.find((p) => p.id === winnerId);
  const drawer = room.players.find((p) => p.id === g.drawerId);
  if (winner) {
    if (room.options.teamMode) {
      g.teamScores[winner.team] += 1;
    } else {
      winner.score += 1;
      if (drawer) drawer.score += 1;
    }
  }
  g.history.push({
    keyword: g.keyword,
    drawer: drawer?.nickname ?? '?',
    winner: winner?.nickname ?? null,
    winnerTeam: winner?.team ?? null,
    url: g.image,
    prompt: g.draftPrompt,
  });
  g.phase = 'reveal';
  g.endsAt = now() + REVEAL_MS;
}

function advSpeed(room) {
  const g = room.game;
  if (g.phase === 'draw' && now() >= g.endsAt) {
    if (g.draftUrl) {
      g.image = g.draftUrl;
      g.phase = 'guess';
      g.endsAt = now() + room.options.textSeconds * 1000;
    } else {
      speedFinishRound(room, g, null);
    }
  } else if (g.phase === 'guess' && now() >= g.endsAt) {
    speedFinishRound(room, g, null);
  } else if (g.phase === 'reveal' && now() >= g.endsAt) {
    g.round += 1;
    if (g.round >= g.totalRounds) room.status = 'finished';
    else speedNewRound(room, g);
  }
}

// ── 스피드 퀴즈 2: 두 팀이 동시에 그리고 먼저 맞힌 팀 +1 ─────

function initSpeedTeam(room) {
  const teamIds = [0, 1].map((t) => shuffle(room.players.filter((p) => p.team === t).map((p) => p.id)));
  const g = {
    teamOrders: teamIds,
    round: 0,
    totalRounds: room.options.rounds,
    used: [],
    history: [],
    teamScores: [0, 0],
  };
  speedTeamNewRound(room, g);
  return g;
}

function speedTeamNewRound(room, g) {
  g.keyword = pickWord(g.used);
  g.used.push(g.keyword.ko);
  g.drawers = [0, 1].map((t) => g.teamOrders[t][g.round % g.teamOrders[t].length]);
  g.teams = [0, 1].map(() => ({ draftUrl: null, draftPrompt: null, image: null }));
  g.guesses = [];
  g.winnerTeam = null;
  g.winnerId = null;
  g.phase = 'play'; // play | reveal
  g.endsAt = now() + (room.options.imageSeconds + room.options.textSeconds) * 1000;
}

function speedTeamFinishRound(room, g, winnerId) {
  const winner = room.players.find((p) => p.id === winnerId);
  g.winnerId = winnerId ?? null;
  g.winnerTeam = winner ? winner.team : null;
  if (winner) g.teamScores[winner.team] += 1;
  g.history.push({
    keyword: g.keyword,
    urls: [g.teams[0].image ?? g.teams[0].draftUrl, g.teams[1].image ?? g.teams[1].draftUrl],
    drawers: g.drawers.map((id) => room.players.find((p) => p.id === id)?.nickname ?? '?'),
    winner: winner?.nickname ?? null,
    winnerTeam: g.winnerTeam,
  });
  g.phase = 'reveal';
  g.endsAt = now() + REVEAL_MS;
}

function advSpeedTeam(room) {
  const g = room.game;
  if (g.phase === 'play' && now() >= g.endsAt) {
    speedTeamFinishRound(room, g, null);
  } else if (g.phase === 'reveal' && now() >= g.endsAt) {
    g.round += 1;
    if (g.round >= g.totalRounds) room.status = 'finished';
    else speedTeamNewRound(room, g);
  }
}

// ── 릴레이 그림 수정: 한 그림을 차례로 계속 수정 ─────────────

function relayGroups(room) {
  if (isTeamGame(room)) {
    return [0, 1].map((t) => room.players.filter((p) => p.team === t).map((p) => p.id));
  }
  return [room.players.map((p) => p.id)];
}

function initRelay(room) {
  const theme = pickWord([]);
  const groups = relayGroups(room).map((ids) => ({
    order: shuffle(ids),
    turn: 0,
    entries: [],
    draftUrl: null,
    draftPrompt: null,
    endsAt: now() + room.options.imageSeconds * 1000,
    done: false,
    score: null,
  }));
  return { theme, groups };
}

function relayLastUrl(group) {
  for (let i = group.entries.length - 1; i >= 0; i--) {
    if (group.entries[i].url) return group.entries[i].url;
  }
  return null;
}

function relayNextTurn(room, group, gi) {
  group.turn += 1;
  group.draftUrl = null;
  group.draftPrompt = null;
  if (group.turn >= group.order.length) {
    group.done = true;
    if (room.options.scored) group.score = mockAiScore(room.code + ':relay:' + gi + ':' + group.entries.length);
  } else {
    group.endsAt = now() + room.options.imageSeconds * 1000;
  }
}

function advRelay(room) {
  const g = room.game;
  g.groups.forEach((group, gi) => {
    if (group.done) return;
    if (now() >= group.endsAt) {
      const pid = group.order[group.turn];
      const p = room.players.find((x) => x.id === pid);
      group.entries.push({ playerId: pid, nickname: p?.nickname ?? '?', prompt: null, url: relayLastUrl(group), skipped: true });
      relayNextTurn(room, group, gi);
    }
  });
  if (g.groups.every((gr) => gr.done)) room.status = 'finished';
}

// ── 협동: 각자 한 조각씩 맡아 하나의 그림 완성 ───────────────

function initCoop(room) {
  const theme = pickWord([]);
  const groups = relayGroups(room).map((ids) => {
    const cols = Math.ceil(Math.sqrt(ids.length));
    return { members: ids, cols, score: null };
  });
  return {
    theme,
    groups,
    subs: new Map(), // playerId -> { prompt, url, submitted }
    endsAt: now() + room.options.imageSeconds * 1000,
  };
}

function advCoop(room) {
  const g = room.game;
  const allSubmitted = room.players.every((p) => g.subs.get(p.id)?.submitted);
  if (!allSubmitted && now() < g.endsAt) return;
  g.groups.forEach((group, gi) => {
    if (room.options.scored) {
      const filled = group.members.filter((id) => g.subs.get(id)?.url).length;
      group.score = Math.min(100, mockAiScore(room.code + ':coop:' + gi) - (group.members.length - filled) * 10);
    }
  });
  room.status = 'finished';
}

// ── 임포스터: 한 명만 키워드를 모른 채 그림 생성 ─────────────

function initImposter(room) {
  const moderatorId = room.options.moderator ? room.players.find((p) => p.isHost).id : null;
  const rolePlayers = room.players.filter((p) => p.id !== moderatorId);
  const imposterId = rolePlayers[Math.floor(Math.random() * rolePlayers.length)].id;
  return {
    moderatorId,
    imposterId,
    keyword: pickWord([]),
    order: shuffle(rolePlayers.map((p) => p.id)),
    turn: 0,
    entries: [],
    draftUrl: null,
    draftPrompt: null,
    phase: 'turns', // turns | guess | done
    endsAt: now() + room.options.imageSeconds * 1000,
    guess: null,
    won: null,
  };
}

function imposterNextTurn(room, g) {
  g.turn += 1;
  g.draftUrl = null;
  g.draftPrompt = null;
  if (g.turn >= g.order.length) {
    g.phase = 'guess';
    g.endsAt = now() + room.options.textSeconds * 1000;
  } else {
    g.endsAt = now() + room.options.imageSeconds * 1000;
  }
}

function imposterFinish(room, g, guessText) {
  g.guess = guessText ?? null;
  g.won = guessText ? wordMatches(g.keyword, guessText) : false;
  g.phase = 'done';
  room.status = 'finished';
}

function advImposter(room) {
  const g = room.game;
  if (g.phase === 'turns' && now() >= g.endsAt) {
    const pid = g.order[g.turn];
    const p = room.players.find((x) => x.id === pid);
    g.entries.push({ playerId: pid, nickname: p?.nickname ?? '?', url: null, prompt: null, skipped: true });
    imposterNextTurn(room, g);
  } else if (g.phase === 'guess' && now() >= g.endsAt) {
    imposterFinish(room, g, null);
  }
}

// ── 행동: 생성(드래프트) / 제출 / 정답 시도 ──────────────────

// 현재 이 플레이어가 이미지를 생성할 수 있는지 + 프롬프트에서 금지할 키워드 반환
export function canGenerate(room, playerId) {
  if (room.status !== 'playing') return { error: 'errNotPlaying' };
  const g = room.game;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: 'errNotPlayer' };

  switch (room.mode) {
    case 'classic': {
      if (classicRoundType(g.round) !== 'image') return { error: 'errNotDrawPhase' };
      if (g.submissions.get(playerId)?.submitted) return { error: 'errAlreadySubmitted' };
      return { keyword: null };
    }
    case 'speed': {
      if (g.phase !== 'draw' || g.drawerId !== playerId) return { error: 'errNotYourTurn' };
      return { keyword: g.keyword };
    }
    case 'speed_team': {
      if (g.phase !== 'play') return { error: 'errNotDrawPhase' };
      const t = player.team;
      if (g.drawers[t] !== playerId) return { error: 'errNotYourTurn' };
      if (g.teams[t].image) return { error: 'errAlreadySubmitted' };
      return { keyword: g.keyword };
    }
    case 'relay': {
      const gi = isTeamGame(room) ? player.team : 0;
      const group = g.groups[gi];
      if (!group || group.done || group.order[group.turn] !== playerId) return { error: 'errNotYourTurn' };
      return { keyword: null };
    }
    case 'coop': {
      if (g.subs.get(playerId)?.submitted) return { error: 'errAlreadySubmitted' };
      return { keyword: null };
    }
    case 'imposter': {
      if (g.phase !== 'turns' || g.order[g.turn] !== playerId) return { error: 'errNotYourTurn' };
      // 임포스터가 아닌 사람은 키워드를 프롬프트에 쓸 수 없다
      return { keyword: playerId === g.imposterId ? null : g.keyword };
    }
    default:
      return { error: 'errBadMode' };
  }
}

export function applyDraft(room, playerId, prompt, url) {
  const g = room.game;
  const player = room.players.find((p) => p.id === playerId);
  switch (room.mode) {
    case 'classic': {
      const prev = g.submissions.get(playerId) ?? {};
      g.submissions.set(playerId, { ...prev, prompt, url, submitted: false });
      break;
    }
    case 'speed':
      g.draftUrl = url;
      g.draftPrompt = prompt;
      break;
    case 'speed_team': {
      const t = player.team;
      g.teams[t].draftUrl = url;
      g.teams[t].draftPrompt = prompt;
      break;
    }
    case 'relay': {
      const gi = isTeamGame(room) ? player.team : 0;
      g.groups[gi].draftUrl = url;
      g.groups[gi].draftPrompt = prompt;
      break;
    }
    case 'coop': {
      const prev = g.subs.get(playerId) ?? {};
      g.subs.set(playerId, { ...prev, prompt, url, submitted: false });
      break;
    }
    case 'imposter':
      g.draftUrl = url;
      g.draftPrompt = prompt;
      break;
  }
}

// 제출: 모드/단계별 확정 동작
export function submitAction(room, playerId, { text }: Record<string, any> = {}) {
  if (room.status !== 'playing') return { error: 'errNotPlaying' };
  const g = room.game;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: 'errNotPlayer' };

  switch (room.mode) {
    case 'classic': {
      if (classicRoundType(g.round) === 'text') {
        const t = String(text ?? '').trim().slice(0, 200);
        if (!t) return { error: 'errEmptyText' };
        g.submissions.set(playerId, { text: t, submitted: true });
      } else {
        if (!g.submissions.get(playerId)?.url) return { error: 'errGenerateFirst' };
        const prev = g.submissions.get(playerId);
        g.submissions.set(playerId, { ...prev, submitted: true });
      }
      advance(room);
      return {};
    }
    case 'speed': {
      if (g.phase !== 'draw' || g.drawerId !== playerId) return { error: 'errNotYourTurn' };
      if (!g.draftUrl) return { error: 'errGenerateFirst' };
      g.image = g.draftUrl;
      g.phase = 'guess';
      g.endsAt = now() + room.options.textSeconds * 1000;
      return {};
    }
    case 'speed_team': {
      if (g.phase !== 'play') return { error: 'errNotDrawPhase' };
      const t = player.team;
      if (g.drawers[t] !== playerId) return { error: 'errNotYourTurn' };
      if (!g.teams[t].draftUrl) return { error: 'errGenerateFirst' };
      g.teams[t].image = g.teams[t].draftUrl;
      return {};
    }
    case 'relay': {
      const gi = isTeamGame(room) ? player.team : 0;
      const group = g.groups[gi];
      if (!group || group.done || group.order[group.turn] !== playerId) return { error: 'errNotYourTurn' };
      if (!group.draftUrl) return { error: 'errGenerateFirst' };
      group.entries.push({ playerId, nickname: player.nickname, prompt: group.draftPrompt, url: group.draftUrl, skipped: false });
      relayNextTurn(room, group, gi);
      advance(room);
      return {};
    }
    case 'coop': {
      if (!g.subs.get(playerId)?.url) return { error: 'errGenerateFirst' };
      const prev = g.subs.get(playerId);
      g.subs.set(playerId, { ...prev, submitted: true });
      advance(room);
      return {};
    }
    case 'imposter': {
      if (g.phase !== 'turns' || g.order[g.turn] !== playerId) return { error: 'errNotYourTurn' };
      if (!g.draftUrl) return { error: 'errGenerateFirst' };
      g.entries.push({ playerId, nickname: player.nickname, prompt: g.draftPrompt, url: g.draftUrl, skipped: false });
      imposterNextTurn(room, g);
      return {};
    }
    default:
      return { error: 'errBadMode' };
  }
}

export function unsubmitAction(room, playerId) {
  if (room.status !== 'playing') return { error: 'errNotPlaying' };
  const g = room.game;
  if (room.mode === 'classic') {
    const prev = g.submissions.get(playerId) ?? {};
    g.submissions.set(playerId, { ...prev, submitted: false });
    return {};
  }
  if (room.mode === 'coop') {
    const prev = g.subs.get(playerId) ?? {};
    g.subs.set(playerId, { ...prev, submitted: false });
    return {};
  }
  return { error: 'errBadMode' };
}

// 정답 시도 (speed / speed_team / imposter 최종 추리)
export function guessAction(room, playerId, text) {
  if (room.status !== 'playing') return { error: 'errNotPlaying' };
  const g = room.game;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: 'errNotPlayer' };
  const t = String(text ?? '').trim().slice(0, 100);
  if (!t) return { error: 'errEmptyText' };

  switch (room.mode) {
    case 'speed': {
      if (g.phase !== 'guess') return { error: 'errNotGuessPhase' };
      if (g.drawerId === playerId) return { error: 'errDrawerCannotGuess' };
      const correct = wordMatches(g.keyword, t);
      g.guesses.push({ nickname: player.nickname, team: player.team, text: t, correct });
      if (correct) speedFinishRound(room, g, playerId);
      return { correct };
    }
    case 'speed_team': {
      if (g.phase !== 'play') return { error: 'errNotGuessPhase' };
      const team = player.team;
      if (g.drawers[team] === playerId) return { error: 'errDrawerCannotGuess' };
      if (!g.teams[team].image) return { error: 'errWaitTeamImage' };
      const correct = wordMatches(g.keyword, t);
      g.guesses.push({ nickname: player.nickname, team, text: t, correct });
      if (correct) speedTeamFinishRound(room, g, playerId);
      return { correct };
    }
    case 'imposter': {
      if (g.phase !== 'guess') return { error: 'errNotGuessPhase' };
      if (playerId !== g.imposterId) return { error: 'errImposterOnly' };
      imposterFinish(room, g, t);
      return { correct: g.won };
    }
    default:
      return { error: 'errBadMode' };
  }
}
