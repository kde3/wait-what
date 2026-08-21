import { NextResponse } from 'next/server';
import { joinRoom } from '../../../../../lib/store';

export async function POST(req, { params }) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const nickname = String(body.nickname ?? '').trim().slice(0, 12);
  if (!nickname) {
    return NextResponse.json({ error: 'errNickname' }, { status: 400 });
  }
  const result = joinRoom(code, nickname);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ code: result.room.code, playerId: result.playerId });
}
