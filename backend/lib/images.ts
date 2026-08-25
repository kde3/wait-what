import { randomBytes } from 'node:crypto';

const TTL_MS = 60 * 60 * 1000;

type Entry = { code: string; buffer: Buffer; contentType: string; createdAt: number };

const store = (): Map<string, Entry> =>
  globalThis.__gpImages ?? (globalThis.__gpImages = new Map());

function prune() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, entry] of store()) {
    if (entry.createdAt < cutoff) store().delete(id);
  }
}

export function putImage(code, buffer: Buffer, contentType = 'image/png') {
  prune();
  const id = randomBytes(12).toString('hex');
  store().set(id, { code: String(code).toUpperCase(), buffer, contentType, createdAt: Date.now() });
  return `/api/image/${id}`;
}

export function getImage(id) {
  return store().get(String(id)) ?? null;
}

export function dropRoomImages(code) {
  const key = String(code).toUpperCase();
  for (const [id, entry] of store()) {
    if (entry.code === key) store().delete(id);
  }
}
