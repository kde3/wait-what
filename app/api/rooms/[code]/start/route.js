import { NextResponse } from 'next/server';
import { getRoom, startGame } from '../../../../../lib/store';

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const result = startGame(room, body.playerId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
