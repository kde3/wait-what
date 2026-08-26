const TIMEOUT_MS = 120_000;

const baseUrl = () => (process.env.AI_SERVER_URL ?? '').replace(/\/+$/, '');

export function aiEnabled() {
  return !!(
    baseUrl() &&
    (process.env.AI_SERVER_TOKEN || (process.env.AI_SERVER_KEY && process.env.AI_SERVER_SECRET))
  );
}

function accessHeaders() {
  if (process.env.AI_SERVER_TOKEN) {
    return { Authorization: `Bearer ${process.env.AI_SERVER_TOKEN}` };
  }
  return {
    'CF-Access-Client-Id': process.env.AI_SERVER_KEY ?? '',
    'CF-Access-Client-Secret': process.env.AI_SERVER_SECRET ?? '',
  };
}

const difficultyMap: Record<string, 'easy' | 'normal' | 'hard'> = {
  normal: 'easy',
  hard: 'normal',
  hell: 'hard',
} as const;

export function aiDifficulty(difficulty: string) {
  return difficultyMap[difficulty] ?? difficultyMap.normal;
}

class AiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, detail = '') {
    super(`${code} (${status}) ${detail}`.trim());
    this.code = code;
    this.status = status;
  }
}

function errorCode(status: number) {
  if (status === 401 || status === 403) return 'errAiAuth';
  if (status === 422) return 'errAiRejected';
  if (status === 503) return 'errAiBusy';
  return 'errAiFailed';
}

async function call(path: string, init: RequestInit) {
  let response;
  try {
    response = await fetch(`${baseUrl()}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new AiError('errAiFailed', 0);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiError(errorCode(response.status), response.status, detail.slice(0, 200));
  }
  return response;
}

export async function generateImage(prompt: string, difficulty = 'normal') {
  const response = await call('/generate', {
    method: 'POST',
    headers: { ...accessHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, difficulty: aiDifficulty(difficulty) }),
  });
  return Buffer.from(await response.arrayBuffer());
}

export async function evaluateImage(image: Buffer, prompt: string) {
  const form = new FormData();
  form.set('image', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'doodle.png');
  form.set('prompt', prompt);
  const response = await call('/evaluate', { method: 'POST', headers: accessHeaders(), body: form });
  const data = await response.json();
  const score = Number(data?.score);
  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    comment: typeof data?.comment === 'string' ? data.comment.slice(0, 120) : null,
  };
}

export { AiError };
