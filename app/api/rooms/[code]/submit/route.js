import { NextResponse } from 'next/server';
import { getRoom, maybeAdvance, roundType, setSubmission, getSubmission } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
  }
  maybeAdvance(room);

  const body = await req.json().catch(() => ({}));
  const player = room.players.find((p) => p.id === body.playerId);

  if (!player) {
    return NextResponse.json({ error: '참가자가 아닙니다.' }, { status: 403 });
  }
  if (room.status !== 'playing') {
    return NextResponse.json({ error: '진행 중인 게임이 아닙니다.' }, { status: 400 });
  }
  if (body.round !== room.round + 1) {
    return NextResponse.json({ error: '라운드가 이미 넘어갔습니다.' }, { status: 409 });
  }

  if (roundType(room.round) === 'text') {
    const text = String(body.text ?? '').trim().slice(0, 200);
    if (!text) {
      return NextResponse.json({ error: '문장을 입력하세요.' }, { status: 400 });
    }
    setSubmission(room, player.id, { text, submitted: true });
  } else {
    if (!getSubmission(room, player.id)?.url) {
      return NextResponse.json({ error: '먼저 이미지를 생성하세요.' }, { status: 400 });
    }
    setSubmission(room, player.id, { submitted: true });
  }

  maybeAdvance(room);
  return NextResponse.json({ ok: true });
}
