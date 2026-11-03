// @vitest-environment node
import { createSitemapFetchHandlers } from './fetch-handlers';
import { SitemapClient } from './render';

const now = new Date('2026-10-08T12:00:00.000Z');
const siteUrl = 'https://example.com';

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
    getSiteUrl: () => siteUrl,
    now: () => now,
  });

const single = { title: 'Example' } as const;
const index = { title: 'Example', mode: 'index' } as const;

describe('sitemap fetch handlers', () => {
  it('serves the sitemap as xml the CDN may keep', async () => {
    const response = await handlers(single).sitemap();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/xml');
    expect(await response.text()).toContain('<urlset');
  });

  it('repeats the cache policy on the headers every CDN vendor reads', async () => {
    const response = await handlers(single).sitemap();
    const policy = response.headers.get('cache-control');

    expect(policy).toBeTruthy();
    expect(response.headers.get('cdn-cache-control')).toBe(policy);
    expect(response.headers.get('vercel-cdn-cache-control')).toBe(policy);
  });

  it('lets the CDN hold a settled past year far longer than a live one', async () => {
    const chunk = handlers(index);
    const settled = await chunk.sitemapChunk('articles-2024');
    const live = await chunk.sitemapChunk('news');

    expect(settled.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(live.headers.get('cache-control')).toContain('s-maxage=600');
  });

  it('answers an unknown chunk name with 404 rather than an empty sitemap', async () => {
    const response = await handlers(index).sitemapChunk('articles-20xx');

    expect(response.status).toBe(404);
  });

  it('answers a chunk with no sitemap behind it with 404', async () => {
    // `single` mode has no chunks at all, and a future period never has one.
    expect((await handlers(single).sitemapChunk('news')).status).toBe(404);
    expect((await handlers(index).sitemapChunk('articles-2027')).status).toBe(
      404
    );
  });

  it('never lets a failed render be cached', async () => {
    const response = await handlers(single, failingClient).sitemap();

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
