import type { Context } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { signToken } from './jwt.js';
import { jwtAuth } from './jwtMiddleware.js';

const secret = 'secret';

function makeContext(authHeader: string | undefined) {
  const store: Record<string, unknown> = {};
  return {
    req: { header: vi.fn().mockReturnValue(authHeader) },
    set: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    json: vi.fn((body: unknown, status: number) => ({ body, status })),
    _store: store,
  } as unknown as Context & { _store: Record<string, unknown> };
}

describe('jwtAuth', () => {
  it('Authorizationヘッダーがない場合：401を返し、nextを呼ばない', async () => {
    const middleware = jwtAuth(secret);
    const c = makeContext(undefined);
    const next = vi.fn();

    await middleware(c, next);

    expect(c.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(next).not.toHaveBeenCalled();
  });

  it('Bearerプレフィックスがない場合：401を返す', async () => {
    const middleware = jwtAuth(secret);
    const c = makeContext('some-token');
    const next = vi.fn();

    await middleware(c, next);

    expect(c.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(next).not.toHaveBeenCalled();
  });

  it('トークンが不正な場合：401を返す', async () => {
    const middleware = jwtAuth(secret);
    const c = makeContext('Bearer invalid-token');
    const next = vi.fn();

    await middleware(c, next);

    expect(c.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(next).not.toHaveBeenCalled();
  });

  it('有効なトークンの場合：ペイロードをセットしてnextを呼ぶ', async () => {
    const token = await signToken({ username: 'alice' }, secret);
    const middleware = jwtAuth(secret);
    const c = makeContext(`Bearer ${token}`);
    const next = vi.fn();

    await middleware(c, next);

    expect(next).toHaveBeenCalled();
    expect(c.json).not.toHaveBeenCalled();
    expect((c._store.jwtPayload as { username: string }).username).toBe('alice');
  });
});
