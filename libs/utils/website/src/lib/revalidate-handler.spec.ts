import type { NextApiRequest, NextApiResponse } from 'next';
import { revalidateHandler } from './revalidate-handler';

const call = async (query: Record<string, string>, method = 'GET') => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    revalidate: vi.fn().mockResolvedValue(undefined),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
    end: vi.fn(),
  };

  await revalidateHandler(
    { method, query } as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  return res;
};

describe('revalidateHandler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('refuses everyone while no REVALIDATE_TOKEN is configured', async () => {
    vi.stubEnv('REVALIDATE_TOKEN', '');

    const res = await call({ path: '/' });

    expect(res.statusCode).toBe(401);
    expect(res.revalidate).not.toHaveBeenCalled();
  });

  it('refuses a wrong secret', async () => {
    vi.stubEnv('REVALIDATE_TOKEN', 'right-secret');

    const res = await call({ secret: 'wrong-secret', path: '/' });

    expect(res.statusCode).toBe(401);
    expect(res.revalidate).not.toHaveBeenCalled();
  });

  it('revalidates the path with the right secret', async () => {
    vi.stubEnv('REVALIDATE_TOKEN', 'right-secret');

    const res = await call({ secret: 'right-secret', path: '/a/news' });

    expect(res.revalidate).toHaveBeenCalledWith('/a/news');
    expect(res.body).toEqual({ revalidated: true });
  });

  it('refuses a path that is not a site path', async () => {
    vi.stubEnv('REVALIDATE_TOKEN', 'right-secret');

    const res = await call({ secret: 'right-secret', path: 'https://x.ch' });

    expect(res.statusCode).toBe(400);
    expect(res.revalidate).not.toHaveBeenCalled();
  });

  it('ends other methods with 405', async () => {
    const res = await call({}, 'POST');

    expect(res.statusCode).toBe(405);
    expect(res.end).toHaveBeenCalled();
  });
});
