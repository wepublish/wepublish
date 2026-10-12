import { NextApiRequest, NextApiResponse } from 'next';
import { createSitemapHandlers } from './handlers';
import { SitemapClient } from './render';

const now = new Date('2026-10-08T12:00:00.000Z');

const emptyClient = () =>
  ({
    query: vi.fn(async () => ({
      data: {
        articles: { nodes: [], pageInfo: { hasNextPage: false } },
        pages: { nodes: [], pageInfo: { hasNextPage: false } },
        page: undefined,
      },
    })),
  }) as unknown as SitemapClient;

const failingClient = () =>
  ({
    query: vi.fn(async () => {
      throw new Error('API down');
    }),
  }) as unknown as SitemapClient;

const request = (
  query: Record<string, string> = {},
  headers: Record<string, string> = { host: 'example.com' }
) => ({ query, headers }) as unknown as NextApiRequest;

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

describe('createSitemapHandlers', () => {
  beforeEach(() => {
    vi.stubEnv('WEBSITE_URL', 'https://example.com/');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves the sitemap as cacheable xml', async () => {
    const { sitemap } = createSitemapHandlers(
      { title: 'Example' },
      { getClient: emptyClient, now: () => now }
    );
    const res = response();

    await sitemap(request(), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/xml');
    expect(res.headers['cache-control']).toContain('s-maxage=600');
    expect(res.headers['cdn-cache-control']).toBe(res.headers['cache-control']);
    expect(res.body).toContain('<loc>https://example.com</loc>');
  });

  it('caches a past month for long', async () => {
    const { sitemapChunk } = createSitemapHandlers(
      { title: 'Example', mode: 'index' },
      { getClient: emptyClient, now: () => now }
    );
    const res = response();

    await sitemapChunk(request({ chunk: 'articles-2026-09' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toContain('s-maxage=86400');
  });

  it.each(['articles-2026-13', 'unknown', 'articles-2027-01'])(
    'answers %s with 404',
    async chunk => {
      const { sitemapChunk } = createSitemapHandlers(
        { title: 'Example', mode: 'index' },
        { getClient: emptyClient, now: () => now }
      );
      const res = response();

      await sitemapChunk(request({ chunk }), res);

      expect(res.statusCode).toBe(404);
    }
  );

  it('answers chunks with 404 in single mode', async () => {
    const { sitemapChunk } = createSitemapHandlers(
      { title: 'Example' },
      { getClient: emptyClient, now: () => now }
    );
    const res = response();

    await sitemapChunk(request({ chunk: 'pages' }), res);

    expect(res.statusCode).toBe(404);
  });

  // the CDN then keeps serving its last good copy (stale-if-error)
  it('answers a failure with an uncacheable 500', async () => {
    const { sitemap } = createSitemapHandlers(
      { title: 'Example' },
      { getClient: failingClient, now: () => now }
    );
    const res = response();

    await sitemap(request(), res);

    expect(res.statusCode).toBe(500);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('takes the site url from the request when WEBSITE_URL is not set', async () => {
    vi.stubEnv('WEBSITE_URL', '');
    const { sitemap } = createSitemapHandlers(
      { title: 'Example' },
      { getClient: emptyClient, now: () => now }
    );
    const res = response();

    await sitemap(
      request(
        {},
        { 'x-forwarded-host': 'www.example.org', 'x-forwarded-proto': 'https' }
      ),
      res
    );

    expect(res.body).toContain('<loc>https://www.example.org</loc>');
  });
});
