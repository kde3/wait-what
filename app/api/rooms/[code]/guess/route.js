import { NextResponse } from 'next/server';
import { getRoom, advance, guessAction } from '../../../../../lib/store';
import { touch, LOBBY } from '../../../../../lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) return NextResponse.json({ error: 'errRoomNotFound' }, { status: 404 });
  advance(room);

  const body = await req.json().catch(() => ({}));
  const result = guessAction(room, body.playerId, body.text);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  touch(code);
  return NextResponse.json({ correct: !!result.correct });
}
