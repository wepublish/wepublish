// @vitest-environment node
import { feedHandler, healthHandler, sitemapHandler } from './server-routes';

const SHARED_CACHE = 'public, max-age=599, s-maxage=599, stale-if-error=86400';

const getFeed = async () => ({
  atom1: () => '<feed />',
  json1: () => '{}',
  rss2: () => '<rss />',
});

describe('server routes', () => {
  it.each(['rss2', 'atom1', 'json1'] as const)(
    'lets the CDN keep the %s feed, rather than inheriting the no-store of /api',
    async format => {
      const response = await feedHandler(
        new Request('https://site.test/rss.xml'),
        getFeed,
        () => 'https://site.test',
        format
      );

      expect(response.headers.get('cache-control')).toBe(SHARED_CACHE);
      expect(response.headers.get('cdn-cache-control')).toBe(SHARED_CACHE);
    }
  );

  it('keeps the sitemap cacheable for the CDN on every vendor', async () => {
    const response = await sitemapHandler(
      async () => '<urlset />',
      () => 'https://site.test'
    );

    expect(response.headers.get('content-type')).toBe('application/xml');
    expect(response.headers.get('cdn-cache-control')).toContain('s-maxage=599');
    expect(response.headers.get('vercel-cdn-cache-control')).toContain(
      's-maxage=599'
    );
  });

  it('never lets the probe endpoint be cached', () => {
    expect(healthHandler().headers.get('cache-control')).toBe('no-store');
  });
});
