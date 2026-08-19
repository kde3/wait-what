import { NextResponse } from 'next/server';
import { getRoom, chainIndexFor, getSubmission, maybeAdvance, roundType } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
  }
  maybeAdvance(room);

  const playerId = req.nextUrl.searchParams.get('playerId');
  const you = room.players.find((p) => p.id === playerId) ?? null;

  const state = {
    code: room.code,
    status: room.status,
    players: room.players.map((p) => ({ nickname: p.nickname, isHost: p.isHost })),
    you: you ? { nickname: you.nickname, isHost: you.isHost } : null,
  };

  if (room.status === 'playing') {
    const type = roundType(room.round);
    const sub = you ? getSubmission(room, you.id) : null;

    // 담당 체인의 직전 항목만 공개 (릴레이 규칙)
    let task = null;
    if (you) {
      const j = chainIndexFor(room, you.id);
      const chain = room.chains[j] ?? [];
      const prev = chain[chain.length - 1] ?? null;
      if (room.round === 0) {
        task = { kind: 'phrase' };
      } else if (type === 'image') {
        task = { kind: 'draw', sourceText: prev?.text ?? null };
      } else {
        task = { kind: 'guess', sourceImage: prev?.url ?? null };
      }
    }

    state.round = {
      number: room.round + 1,
      total: room.totalRounds,
      type,
      remaining: Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000)),
      task,
      submitted: !!sub?.submitted,
      draft: sub ? { text: sub.text ?? null, prompt: sub.prompt ?? null, url: sub.url ?? null } : null,
      players: room.players.map((p) => ({
        nickname: p.nickname,
        submitted: !!room.submissions.get(p.id)?.submitted,
      })),
    };
  }

  if (room.status === 'finished') {
    state.albums = room.chains.map((chain, j) => ({
      owner: room.players.find((p) => p.id === room.order[j])?.nickname ?? '?',
      entries: chain.map((e) => ({
        type: e.type,
        text: e.text,
        prompt: e.prompt,
        url: e.url,
        author: e.authorNickname,
      })),
    }));
  }

  return NextResponse.json(state);
}
