import { NextResponse } from 'next/server';
import { getRoom, maybeAdvance, roundType, setSubmission, getSubmission } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

// 목업 모드: 실제 이미지 생성 API를 호출하지 않고 고정 이미지를 반환한다.
// 실제 API 연동 시 이 함수에서 생성 API URL을 만들어 반환하면 된다.
function imageUrl(_prompt) {
  return '/image.png';
}

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
  }
  maybeAdvance(room);

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? '').trim().slice(0, 300);
  const player = room.players.find((p) => p.id === body.playerId);

  if (!player) {
    return NextResponse.json({ error: '참가자가 아닙니다.' }, { status: 403 });
  }
  if (room.status !== 'playing' || roundType(room.round) !== 'image') {
    return NextResponse.json({ error: '지금은 그림 그리기 단계가 아닙니다.' }, { status: 400 });
  }
  if (body.round !== room.round + 1) {
    return NextResponse.json({ error: '라운드가 이미 넘어갔습니다.' }, { status: 409 });
  }
  if (!prompt) {
    return NextResponse.json({ error: '프롬프트를 입력하세요.' }, { status: 400 });
  }
  if (getSubmission(room, player.id)?.submitted) {
    return NextResponse.json({ error: '제출을 취소한 뒤 다시 생성하세요.' }, { status: 400 });
  }

  const url = imageUrl(prompt);
  setSubmission(room, player.id, { prompt, url, submitted: false });
  return NextResponse.json({ url });
}
