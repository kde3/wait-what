const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').replace(/\/+$/, '');

export function apiUrl(path: string) {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return backendUrl ? `${backendUrl}${normalizedPath}` : normalizedPath;
}

export function websocketUrl(channel: string, playerId?: string | null) {
  const origin = backendUrl || window.location.origin;
  const url = new URL('/ws', origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.search = new URLSearchParams({
    code: channel,
    playerId: playerId ?? '',
  }).toString();
  return url.toString();
}
