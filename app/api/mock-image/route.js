import { NextResponse } from 'next/server';

// 목업 이미지 생성기: 프롬프트 시드로 색/도형이 달라지는 SVG를 그린다.
// 실제 이미지 생성 API 연동 전까지 전 모드를 플레이 가능하게 해주는 대체물.

const PALETTES = [
  ['#2b1e66', '#7c5cff', '#ffd166'],
  ['#0f3d3e', '#34d1bf', '#f9f871'],
  ['#4a1942', '#ff6b81', '#ffd6e0'],
  ['#1b3a5c', '#4cc9f0', '#f72585'],
  ['#3d2b1f', '#e07a5f', '#f2cc8f'],
  ['#14213d', '#fca311', '#e5e5e5'],
  ['#233d2c', '#7bc043', '#fdf498'],
  ['#31263e', '#b388eb', '#8093f1'],
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

function esc(s) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}

function wrapText(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? line + ' ' + w : w;
    if (candidate.length > width && line) {
      lines.push(line);
      line = w;
    } else if (candidate.length > width) {
      // 공백 없는 긴 단어(한중일 문장)는 강제로 자른다
      for (let i = 0; i < candidate.length; i += width) lines.push(candidate.slice(i, i + width));
      line = '';
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const seed = (parseInt(sp.get('s') ?? '0', 10) || 0) + (parseInt(sp.get('n') ?? '0', 10) || 0);
  const prompt = String(sp.get('p') ?? '').slice(0, 120);
  const rnd = mulberry(seed + 1);
  const pal = PALETTES[seed % PALETTES.length];

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

  const lines = wrapText(prompt, 24);
  const textY = 340 - (lines.length - 1) * 22;
  const textEls = lines
    .map((l, i) => `<text x="256" y="${textY + i * 22}" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="600" fill="#ffffff" opacity="0.92">${esc(l)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384" viewBox="0 0 512 384">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}" stop-opacity="0.55"/>
</linearGradient></defs>
<rect width="512" height="384" fill="url(#bg)"/>
${shapes}
<rect x="0" y="${textY - 28}" width="512" height="${384 - textY + 28}" fill="#000" opacity="0.35"/>
${textEls}
<text x="500" y="20" text-anchor="end" font-family="sans-serif" font-size="11" fill="#fff" opacity="0.45">AI MOCK</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
