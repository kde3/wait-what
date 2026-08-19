import { NextResponse } from 'next/server';
import { createRoom } from '../../../lib/store';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const nickname = String(body.nickname ?? '').trim().slice(0, 12);
  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력하세요.' }, { status: 400 });
  }
  const { room, playerId } = createRoom(nickname);
  return NextResponse.json({ code: room.code, playerId });
}
