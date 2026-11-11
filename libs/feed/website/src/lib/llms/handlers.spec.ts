import { NextApiRequest, NextApiResponse } from 'next';
import { createLlmsTxtHandler } from './handlers';
import { SitemapClient } from '../sitemap';

const emptyClient = () =>
  ({
    query: vi.fn(async () => ({
      data: { articles: { nodes: [] }, pages: { nodes: [] } },
    })),
  }) as unknown as SitemapClient;

const failingClient = () =>
  ({
    query: vi.fn(async () => {
      throw new Error('API down');
    }),
  }) as unknown as SitemapClient;

const request = () =>
  ({
    query: {},
    headers: { host: 'example.com' },
  }) as unknown as NextApiRequest;

const response = () => {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: undefined as string | undefined,
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
    end() {
      return res;
    },
  };

  return res as typeof res & NextApiResponse;
};

describe('createLlmsTxtHandler', () => {
  beforeEach(() => {
    vi.stubEnv('WEBSITE_URL', 'https://example.com/');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves markdown the CDN may keep', async () => {
    const res = response();

    await createLlmsTxtHandler(
      { title: 'Example' },
      { getClient: emptyClient }
    )(request(), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/markdown; charset=utf-8');
    expect(res.headers['cache-control']).toContain('s-maxage=');
    expect(res.headers['cdn-cache-control']).toBe(res.headers['cache-control']);
    expect(res.body).toContain('- [Example](https://example.com)');
  });

  it('answers a failing API with an uncached 500', async () => {
    const res = response();

    await createLlmsTxtHandler(
      { title: 'Example' },
      { getClient: failingClient }
    )(request(), res);

    expect(res.statusCode).toBe(500);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
