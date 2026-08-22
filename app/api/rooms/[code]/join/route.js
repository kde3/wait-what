import { NextResponse } from 'next/server';
import { joinRoom } from '../../../../../lib/store';
import { touch, LOBBY } from '../../../../../lib/realtime';

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
  touch(result.room.code); // 대기 중인 사람들에게 새 참가자 알림
  touch(LOBBY);
  return NextResponse.json({ code: result.room.code, playerId: result.playerId });
}
