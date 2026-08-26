import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aiEnabled, generateImage } from '../../lib/ai';

try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env.dev', import.meta.url)));
} catch {}

describe.skipIf(!aiEnabled())('실제 AI 서버', () => {
  it('generateImage가 이미지 Buffer를 돌려준다', async () => {
    const buffer = await generateImage('a cute cat drawing');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isWebp = buffer.subarray(0, 4).toString('latin1') === 'RIFF';
    const isGif = buffer.subarray(0, 3).toString('latin1') === 'GIF';
    expect(isPng || isJpeg || isWebp || isGif).toBe(true);
  }, 130_000);
});
