import { NextResponse } from 'next/server';

// 목업 이미지 생성기: 시드로 색/도형이 달라지는 SVG를 그린다.
// 실제 이미지 생성 API 연동 전까지 전 모드를 플레이 가능하게 해주는 대체물.
//
// 프롬프트는 절대 받지도, 그리지도 않는다. 이 이미지는 다른 참가자에게 그대로 보이기 때문에
// 프롬프트가 그림이나 URL에 남으면 정답이 새어 나간다.

const PALETTES = [
  ['#0b1d51', '#725cad', '#ffe3a9'],
  ['#0e2f4a', '#8ccdeb', '#ffe3a9'],
  ['#2a1a4e', '#a07ccc', '#ffd9e8'],
  ['#08283c', '#5fb7d4', '#cfeeff'],
  ['#1e2a5e', '#7f8fd6', '#ffe3a9'],
  ['#3a2352', '#c4a5ff', '#ffe9c4'],
  ['#0c3340', '#7fe3c0', '#eafff4'],
  ['#4a2c3f', '#ff8fa3', '#ffe3d0'],
];

function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const seed = (parseInt(sp.get('s') ?? '0', 10) || 0) + (parseInt(sp.get('n') ?? '0', 10) || 0);
  const rnd = mulberry(seed + 1);
  const pal = PALETTES[Math.abs(seed) % PALETTES.length];

  let shapes = '';
  const shapeCount = 5 + Math.floor(rnd() * 5);
  for (let i = 0; i < shapeCount; i++) {
    const cx = 40 + rnd() * 432;
    const cy = 40 + rnd() * 300;
    const size = 20 + rnd() * 90;
    const color = pal[1 + Math.floor(rnd() * 2)];
    const op = (0.25 + rnd() * 0.5).toFixed(2);
    const kind = Math.floor(rnd() * 3);
    if (kind === 0) {
      shapes += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(size / 2).toFixed(0)}" fill="${color}" opacity="${op}"/>`;
    } else if (kind === 1) {
      shapes += `<rect x="${(cx - size / 2).toFixed(0)}" y="${(cy - size / 2).toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(0)}" rx="${(size / 6).toFixed(0)}" fill="${color}" opacity="${op}" transform="rotate(${(rnd() * 90).toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
    } else {
      const x2 = cx + size, x3 = cx + size / 2, y3 = cy - size;
      shapes += `<polygon points="${cx.toFixed(0)},${cy.toFixed(0)} ${x2.toFixed(0)},${cy.toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)}" fill="${color}" opacity="${op}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384" viewBox="0 0 512 384">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}" stop-opacity="0.55"/>
</linearGradient></defs>
<rect width="512" height="384" fill="url(#bg)"/>
${shapes}
<text x="500" y="20" text-anchor="end" font-family="sans-serif" font-size="11" fill="#fff" opacity="0.45">AI MOCK</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
