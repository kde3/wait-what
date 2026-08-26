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
  stayInRoom,
  setTeam,
  startGame,
  submitAction,
  unsubmitAction,
  voteAction,
} from './lib/store.js';
import { buildState } from './lib/serialize.js';
import { aiEnabled, generateImage, AiError } from './lib/ai.js';
import { putImage, getImage } from './lib/images.js';
import { HOME, touch, scheduleLeave } from './lib/realtime.js';

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
    password: req.body?.password,
    lang: req.body?.lang,
  });
  scheduleLeave(room.code, playerId);
  touch(HOME);
  res.json({ code: room.code, playerId });
});

apiRouter.post('/rooms/:code/join', (req, res) => {
  const nickname = String(req.body?.nickname ?? '').trim().slice(0, 12);
  if (!nickname) return res.status(400).json({ error: 'errNickname' });
  const result = joinRoom(req.params.code, nickname, req.body?.password);
  if (result.error) return res.status(400).json({ error: result.error });
  scheduleLeave(result.room.code, result.playerId);
  touch(result.room.code);
  touch(HOME);
  res.json({ code: result.room.code, playerId: result.playerId });
});

apiRouter.get('/rooms/:code/info', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  res.json({
    code: room.code,
    name: room.name,
    isPublic: room.isPublic,
    status: room.status,
    playerCount: room.players.length,
  });
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
  touch(HOME);
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
  touch(HOME);
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/restart', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  const result = stayInRoom(room, req.body?.playerId);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  touch(HOME);
  res.json({ ok: true });
});

apiRouter.post('/rooms/:code/generate', async (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  advance(room);
  const prompt = String(req.body?.prompt ?? '').trim().slice(0, 300);
  if (!prompt) return res.status(400).json({ error: 'errEmptyPrompt' });
  const playerId = req.body?.playerId;
  const check = canGenerate(room, playerId);
  if (check.error) return res.status(400).json({ error: check.error });
  const banned = promptViolation(room, prompt, check.keyword);
  if (banned) return res.status(400).json({ error: 'errBannedWord', word: banned });

  let url;
  if (aiEnabled()) {
    try {
      const png = await generateImage(prompt, room.options.difficulty);
      url = putImage(room.code, png);
    } catch (error) {
      const code = error instanceof AiError ? error.code : 'errAiFailed';
      return res.status(502).json({ error: code });
    }
  } else {
    let hash = 7;
    for (const char of prompt) hash = (hash * 31 + char.charCodeAt(0)) % 99991;
    url = `/api/mock-image?s=${hash}&n=${Math.floor(Math.random() * 1e6)}`;
  }

  if (!getRoom(room.code)) return res.status(404).json({ error: 'errRoomNotFound' });
  applyDraft(room, playerId, prompt, url);
  touch(req.params.code);
  res.json({ url });
});

apiRouter.get('/image/:id', (req, res) => {
  const entry = getImage(req.params.id);
  if (!entry) return res.status(404).json({ error: 'errRoomNotFound' });
  res.set({ 'Content-Type': entry.contentType, 'Cache-Control': 'public, max-age=86400, immutable' });
  res.send(entry.buffer);
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

apiRouter.post('/rooms/:code/vote', (req, res) => {
  const room = roomOr404(req, res);
  if (!room) return;
  advance(room);
  const result = voteAction(room, req.body?.playerId, req.body?.target);
  if (result.error) return res.status(400).json({ error: result.error });
  touch(req.params.code);
  res.json({ ok: true });
});

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
