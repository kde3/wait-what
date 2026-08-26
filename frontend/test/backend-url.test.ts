import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadWith(backendUrl: string | undefined) {
  vi.resetModules();
  if (backendUrl === undefined) vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', '');
  else vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', backendUrl);
  return import('../lib/backend-url');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('apiUrl', () => {
  it('상대경로 앞에 백엔드 오리진을 붙인다', async () => {
    const { apiUrl } = await loadWith('http://localhost:3001');
    expect(apiUrl('/api/image/abc')).toBe('http://localhost:3001/api/image/abc');
    expect(apiUrl('api/image/abc')).toBe('http://localhost:3001/api/image/abc');
  });

  it('백엔드 URL 끝의 슬래시는 정리된다', async () => {
    const { apiUrl } = await loadWith('http://localhost:3001///');
    expect(apiUrl('/api/rooms')).toBe('http://localhost:3001/api/rooms');
  });

  it('절대 URL은 그대로 통과시킨다', async () => {
    const { apiUrl } = await loadWith('http://localhost:3001');
    expect(apiUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(apiUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(apiUrl('blob:http://localhost/xyz')).toBe('blob:http://localhost/xyz');
  });

  it('백엔드 URL이 없으면 상대경로를 그대로 둔다', async () => {
    const { apiUrl } = await loadWith(undefined);
    expect(apiUrl('/api/image/abc')).toBe('/api/image/abc');
  });
});

describe('websocketUrl', () => {
  it('백엔드 오리진을 ws 스킴으로 바꾸고 code/playerId를 붙인다', async () => {
    const { websocketUrl } = await loadWith('http://localhost:3001');
    const url = new URL(websocketUrl('PLAY', 'player-1'));
    expect(url.protocol).toBe('ws:');
    expect(url.pathname).toBe('/ws');
    expect(url.searchParams.get('code')).toBe('PLAY');
    expect(url.searchParams.get('playerId')).toBe('player-1');
  });

  it('https 백엔드면 wss가 된다', async () => {
    const { websocketUrl } = await loadWith('https://api.example.com');
    expect(websocketUrl('PLAY', null).startsWith('wss://api.example.com/ws')).toBe(true);
  });

  it('백엔드 URL이 없으면 현재 오리진을 쓴다', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    const { websocketUrl } = await loadWith(undefined);
    expect(websocketUrl('PLAY', null).startsWith('ws://localhost:3000/ws')).toBe(true);
  });
});
