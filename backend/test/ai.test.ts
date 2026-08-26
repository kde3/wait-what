import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AiError, aiEnabled, evaluateImage, generateImage } from '../lib/ai';

let server;
let handler;
const savedEnv: Record<string, string | undefined> = {};

function respondJson(payload) {
  handler = (req, res) => {
    req.resume();
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  };
}

beforeAll(async () => {
  server = createServer((req, res) => handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  for (const key of ['AI_SERVER_URL', 'AI_SERVER_KEY', 'AI_SERVER_SECRET']) {
    savedEnv[key] = process.env[key];
  }
  process.env.AI_SERVER_URL = `http://127.0.0.1:${server.address().port}/`;
  process.env.AI_SERVER_KEY = 'test-key';
  process.env.AI_SERVER_SECRET = 'test-secret';
});

afterAll(async () => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await new Promise((resolve) => server.close(resolve));
});

describe('aiEnabled', () => {
  it('URL/KEY/SECRET이 모두 있으면 true', () => {
    expect(aiEnabled()).toBe(true);
  });
});

describe('generateImage', () => {
  it('성공하면 Buffer를 돌려주고 CF-Access 헤더를 전달한다', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    let seen;
    handler = (req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        seen = { url: req.url, method: req.method, headers: req.headers, body };
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(png);
      });
    };
    const result = await generateImage('귀여운 고양이', 'hard');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.equals(png)).toBe(true);
    expect(seen.method).toBe('POST');
    expect(seen.url).toBe('/generate');
    expect(seen.headers['cf-access-client-id']).toBe('test-key');
    expect(seen.headers['cf-access-client-secret']).toBe('test-secret');
    expect(JSON.parse(seen.body)).toEqual({ prompt: '귀여운 고양이', difficulty: 'hard' });
  });

  it.each([
    [401, 'errAiAuth'],
    [403, 'errAiAuth'],
    [422, 'errAiRejected'],
    [503, 'errAiBusy'],
    [500, 'errAiFailed'],
  ])('상태코드 %i는 %s로 매핑된다', async (status, code) => {
    handler = (req, res) => {
      req.resume();
      req.on('end', () => {
        res.writeHead(status);
        res.end('거절 사유');
      });
    };
    const error = await generateImage('아무거나').catch((e) => e);
    expect(error).toBeInstanceOf(AiError);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
  });

  it('연결 자체가 실패하면 errAiFailed(status 0)', async () => {
    const previous = process.env.AI_SERVER_URL;
    process.env.AI_SERVER_URL = 'http://127.0.0.1:9';
    const error = await generateImage('아무거나').catch((e) => e);
    process.env.AI_SERVER_URL = previous;
    expect(error).toBeInstanceOf(AiError);
    expect(error.code).toBe('errAiFailed');
    expect(error.status).toBe(0);
  });
});

describe('evaluateImage', () => {
  it('score는 반올림되고 comment는 120자로 잘린다', async () => {
    respondJson({ score: 87.6, comment: '평'.repeat(200) });
    const result = await evaluateImage(Buffer.from('이미지'), '프롬프트');
    expect(result.score).toBe(88);
    expect(result.comment).toBe('평'.repeat(120));
  });

  it('score는 0~100으로 클램프된다', async () => {
    respondJson({ score: 150, comment: '높음' });
    expect((await evaluateImage(Buffer.from('a'), 'p')).score).toBe(100);
    respondJson({ score: -3, comment: '낮음' });
    expect((await evaluateImage(Buffer.from('a'), 'p')).score).toBe(0);
  });

  it('비정상 score와 비문자열 comment는 null이 된다', async () => {
    respondJson({ score: '숫자아님', comment: 12345 });
    const result = await evaluateImage(Buffer.from('a'), 'p');
    expect(result.score).toBeNull();
    expect(result.comment).toBeNull();
  });
});
