import { NextResponse } from 'next/server';
import { getRoom, configRoom } from '../../../../../lib/store';
import { touch, LOBBY } from '../../../../../lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) return NextResponse.json({ error: 'errRoomNotFound' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const result = configRoom(room, body.playerId, body.patch ?? {});
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  touch(code);
  touch(LOBBY);
  return NextResponse.json({ ok: true });
}
