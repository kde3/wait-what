import { NextResponse } from 'next/server';
import { getRoom, maybeAdvance, setSubmission } from '../../../../../lib/store';

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
  if (room.status !== 'playing' || body.round !== room.round + 1) {
    return NextResponse.json({ error: '라운드가 이미 넘어갔습니다.' }, { status: 409 });
  }

  setSubmission(room, player.id, { submitted: false });
  return NextResponse.json({ ok: true });
}
