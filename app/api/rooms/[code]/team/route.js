import { NextResponse } from 'next/server';
import { getRoom, setTeam } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) return NextResponse.json({ error: 'errRoomNotFound' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const result = setTeam(room, body.playerId, body.team);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
