import { NextResponse } from 'next/server';
import { createRoom, listPublicRooms } from '../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ rooms: listPublicRooms() });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const nickname = String(body.nickname ?? '').trim().slice(0, 12);
  if (!nickname) {
    return NextResponse.json({ error: 'errNickname' }, { status: 400 });
  }
  const { room, playerId } = createRoom(nickname, {
    name: body.roomName,
    isPublic: body.isPublic,
    lang: body.lang,
  });
  return NextResponse.json({ code: room.code, playerId });
}
