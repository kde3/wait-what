import { NextResponse } from 'next/server';
import { getRoom, advance } from '../../../../../lib/store';
import { buildState } from '../../../../../lib/serialize';
import '../../../../../lib/realtime'; // 브로드캐스트 티커 기동

export const dynamic = 'force-dynamic';

// 웹소켓이 주 경로지만, 연결 전 최초 로드와 웹소켓 실패 시 폴백으로 계속 쓰인다.
export async function GET(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) return NextResponse.json({ error: 'errRoomNotFound' }, { status: 404 });
  advance(room);

  const playerId = req.nextUrl.searchParams.get('playerId');
  return NextResponse.json(buildState(room, playerId));
}
