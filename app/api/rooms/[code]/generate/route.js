import { NextResponse } from 'next/server';
import { getRoom, advance, canGenerate, applyDraft, promptViolation } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

// 목업 모드: 실제 이미지 생성 API 대신 프롬프트가 새겨진 SVG 목업을 반환한다.
// 실제 API 연동 시 이 함수에서 생성 API를 호출해 URL을 반환하면 된다.
function mockImageUrl(prompt) {
  let h = 7;
  for (const c of prompt) h = (h * 31 + c.charCodeAt(0)) % 99991;
  const nonce = Math.floor(Math.random() * 1e6); // 같은 프롬프트라도 다시 생성하면 다른 그림
  return `/api/mock-image?s=${h}&n=${nonce}&p=${encodeURIComponent(prompt.slice(0, 120))}`;
}

export async function POST(req, { params }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) return NextResponse.json({ error: 'errRoomNotFound' }, { status: 404 });
  advance(room);

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? '').trim().slice(0, 300);
  if (!prompt) return NextResponse.json({ error: 'errEmptyPrompt' }, { status: 400 });

  const check = canGenerate(room, body.playerId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: 400 });

  const banned = promptViolation(room, prompt, check.keyword);
  if (banned) {
    return NextResponse.json({ error: 'errBannedWord', word: banned }, { status: 400 });
  }

  const url = mockImageUrl(prompt);
  applyDraft(room, body.playerId, prompt, url);
  return NextResponse.json({ url });
}
