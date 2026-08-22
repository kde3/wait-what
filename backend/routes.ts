import { Router } from 'express';
import {
  advance,
  applyDraft,
  canGenerate,
  configRoom,
  createRoom,
  getRoom,
  guessAction,
  joinRoom,
  listPublicRooms,
  promptViolation,
  setTeam,
  startGame,
  submitAction,
  unsubmitAction,
} from './lib/store.js';
import { buildState } from './lib/serialize.js';
import { LOBBY, touch } from './lib/realtime.js';

export const apiRouter = Router();

const roomOr404 = (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) res.status(404).json({ error: 'errRoomNotFound' });
  return room;
};

apiRouter.get('/rooms', (_req, res) => res.json({ rooms: listPublicRooms() }));

apiRouter.post('/rooms', (req, res) => {
  const nickname = String(req.body?.nickname ?? '').trim().slice(0, 12);
  if (!nickname) return res.status(400).json({ error: 'errNickname' });
  const { room, playerId } = createRoom(nickname, {
    name: req.body?.roomName,
    isPublic: req.body?.isPublic,
    lang: req.body?.lang,
  });
  touch(LOBBY);
  res.json({ code: room.code, playerId });
});

apiRouter.post('/rooms/:code/join', (req, res) => {
  const nickname = String(req.body?.nickname ?? '').trim().slice(0, 12);
  if (!nickname) return res.status(400).json({ error: 'errNickname' });
  const result = joinRoom(req.params.code, nickname);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(result.room.code);
  touch(LOBBY);
  res.json({ code: result.room.code, playerId: result.playerId });
});

apiRouter.get('/rooms/:code/state', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  advance(room);
  res.json(buildState(room, req.query.playerId));
});

apiRouter.post('/rooms/:code/config', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  const result = configRoom(room, req.body?.playerId, req.body?.patch ?? {});
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  touch(LOBBY);
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/team', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  const result = setTeam(room, req.body?.playerId, req.body?.team);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/start', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  const result = startGame(room, req.body?.playerId);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  touch(LOBBY);
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/generate', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  advance(room);
  const prompt = String(req.body?.prompt ?? '').trim().slice(0, 300);
  if (!prompt) return res.status(400).json({ error: 'errEmptyPrompt' });
  const check = canGenerate(room, req.body?.playerId);
  if (check.error) return res.status(400).json({ error: check.error });
  const banned = promptViolation(room, prompt, check.keyword);
  if (banned) return res.status(400).json({ error: 'errBannedWord', word: banned });
  let hash = 7;
  for (const char of prompt) hash = (hash * 31 + char.charCodeAt(0)) % 99991;
  const url = `/api/mock-image?s=${hash}&n=${Math.floor(Math.random() * 1e6)}`;
  applyDraft(room, req.body?.playerId, prompt, url);
  touch(req.params.code);
  res.json({ url });
});

const submissionActions: Array<[string, (room: any, body: any) => any]> = [
  ['submit', (room, body) => submitAction(room, body.playerId, { text: body.text })],
  ['unsubmit', (room, body) => unsubmitAction(room, body.playerId)],
];

for (const [path, action] of submissionActions) {
  apiRouter.post(`/rooms/:code/${path}`, (req, res) => {
    const room = roomOr404(req, res);
    if (!room) return;
    advance(room);
    const result = action(room, req.body ?? {});
    if (result.error) return res.status(400).json({ error: result.error });
    touch(req.params.code);
    res.json({ ok: true });
  });
}

apiRouter.post('/rooms/:code/guess', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  advance(room);
  const result = guessAction(room, req.body?.playerId, req.body?.text);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  res.json({ correct: !!result.correct });
});

const palettes = [
  ['#174f40', '#35b783', '#f5bc42'], ['#245d50', '#52b9cf', '#f5d77c'],
  ['#315c48', '#8acb88', '#f0aa83'], ['#1f5949', '#68cda0', '#d7efb2'],
];

apiRouter.get('/mock-image', (req, res) => {
  const seed = (Number.parseInt(String(req.query.s ?? '0'), 10) || 0) + (Number.parseInt(String(req.query.n ?? '0'), 10) || 0);
  const palette = palettes[Math.abs(seed) % palettes.length];
  const shapes = Array.from({ length: 8 }, (_, index) => {
    const value = Math.abs(Math.sin(seed + index * 97));
    const x = 35 + ((seed * (index + 3) * 17) % 430 + 430) % 430;
    const y = 35 + ((seed * (index + 5) * 11) % 310 + 310) % 310;
    const radius = 18 + Math.round(value * 55);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${palette[1 + (index % 2)]}" opacity="${(0.2 + value * 0.45).toFixed(2)}"/>`;
  }).join('');
  res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' });
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384"><rect width="512" height="384" fill="${palette[0]}"/>${shapes}<text x="500" y="22" text-anchor="end" fill="white" opacity=".5" font-family="sans-serif" font-size="12">AI MOCK</text></svg>`);
});
