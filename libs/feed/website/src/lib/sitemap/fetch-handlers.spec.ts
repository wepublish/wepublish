// @vitest-environment node
import { createSitemapFetchHandlers } from './fetch-handlers';
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

const handlers = (
  config: Parameters<typeof createSitemapFetchHandlers>[0],
  getClient = emptyClient
) =>
  createSitemapFetchHandlers(config, {
    getClient,
    now: () => now,
  });

const request = (headers: Record<string, string> = { host: 'example.com' }) =>
  new Request('http://internal:3000/sitemap.xml', { headers });

const single = { title: 'Example' } as const;
const index = { title: 'Example', mode: 'index' } as const;

describe('sitemap fetch handlers', () => {
  beforeEach(() => {
    vi.stubEnv('WEBSITE_URL', 'https://example.com/');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves the sitemap as xml the CDN may keep', async () => {
    const response = await handlers(single).sitemap(request());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/xml');
    expect(await response.text()).toContain('<urlset');
  });

  it('repeats the cache policy on the headers every CDN vendor reads', async () => {
    const response = await handlers(single).sitemap(request());
    const policy = response.headers.get('cache-control');

    expect(policy).toBeTruthy();
    expect(response.headers.get('cdn-cache-control')).toBe(policy);
    expect(response.headers.get('vercel-cdn-cache-control')).toBe(policy);
  });

  it('lets the CDN hold a settled past year far longer than a live one', async () => {
    const chunk = handlers(index);
    const settled = await chunk.sitemapChunk(request(), 'articles-2024');
    const live = await chunk.sitemapChunk(request(), 'news');

    expect(settled.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(live.headers.get('cache-control')).toContain('s-maxage=600');
  });

  it('answers an unknown chunk name with 404 rather than an empty sitemap', async () => {
    const response = await handlers(index).sitemapChunk(
      request(),
      'articles-20xx'
    );

    expect(response.status).toBe(404);
  });

  it('answers a chunk with no sitemap behind it with 404', async () => {
    // `single` mode has no chunks at all, and a future period never has one.
    expect(
      (await handlers(single).sitemapChunk(request(), 'news')).status
    ).toBe(404);
    expect(
      (await handlers(index).sitemapChunk(request(), 'articles-2027')).status
    ).toBe(404);
  });

  it('never lets a failed render be cached', async () => {
    const response = await handlers(single, failingClient).sitemap(request());

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('drops the trailing slash of WEBSITE_URL', async () => {
    const response = await handlers({
      ...index,
      sitemapPath: '/sitemap',
    }).sitemap(request());
    const xml = await response.text();

    expect(xml).toContain('<loc>https://example.com/sitemap/news</loc>');
    expect(xml).not.toContain('example.com//');
  });

  it('takes the site url from the proxy headers when WEBSITE_URL is not set', async () => {
    vi.stubEnv('WEBSITE_URL', '');

    const response = await handlers(single).sitemap(
      request({
        host: 'internal:3000',
        'x-forwarded-host': 'www.example.org',
        'x-forwarded-proto': 'http',
      })
    );

    expect(await response.text()).toContain(
      '<loc>http://www.example.org</loc>'
    );
  });

  it('serves localhost over http when no proxy names the protocol', async () => {
    vi.stubEnv('WEBSITE_URL', '');

    const response = await handlers(single).sitemap(
      request({ host: 'localhost:4200' })
    );

    expect(await response.text()).toContain('<loc>http://localhost:4200</loc>');
  });

  it('assumes https for any other host', async () => {
    vi.stubEnv('WEBSITE_URL', '');

    const response = await handlers(single).sitemap(
      request({ host: 'www.example.org' })
    );

    expect(await response.text()).toContain(
      '<loc>https://www.example.org</loc>'
    );
  });
});
