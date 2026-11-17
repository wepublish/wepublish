import {
  deriveSeoChecks,
  getSeoUrls,
  parseSitemap,
  SEO_CHECKLIST_ITEM_ID,
  SeoChecksInput,
  SeoProbeResult,
} from './seo-checklist';
import { SeoCheckId, SeoCheckStatus } from './seo-checklist.model';

const ok = (body: string): SeoProbeResult => ({
  reachable: true,
  status: 200,
  body,
});

const sitemapUrl = 'https://example.com/api/sitemap';

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url><loc>https://example.com</loc></url>
  <url><loc>https://example.com/a/foo</loc></url>
</urlset>`;

const articleHtml = `<html><head>
<link rel="canonical" href="https://example.com/a/foo"/>
<script type="application/ld+json">{"@context":"http://schema.org","@type":"NewsArticle","headline":"Foo"}</script>
</head></html>`;

const baseInput: SeoChecksInput = {
  websiteUrl: 'https://example.com',
  sitemaps: [{ url: sitemapUrl, urlCount: 2, hasNews: true }],
  rssFeed: ok(
    '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'
  ),
  latestArticleUrl: 'https://example.com/a/foo',
  latestArticle: ok(articleHtml),
  publication: { name: 'Example', hasLogo: true },
};

const getCheck = (input: SeoChecksInput, id: SeoCheckId) =>
  deriveSeoChecks(input).find(check => check.id === id);

describe('deriveSeoChecks', () => {
  test('reports a healthy setup', () => {
    expect(
      deriveSeoChecks(baseInput).map(check => [check.id, check.status])
    ).toEqual([
      [SeoCheckId.Sitemap, SeoCheckStatus.Ok],
      [SeoCheckId.NewsSitemap, SeoCheckStatus.Ok],
      [SeoCheckId.Feed, SeoCheckStatus.Ok],
      [SeoCheckId.ArticleMarkup, SeoCheckStatus.Ok],
      [SeoCheckId.PublicationMetadata, SeoCheckStatus.Ok],
    ]);
  });

  test('detects the existing sitemap and counts its urls', () => {
    expect(getCheck(baseInput, SeoCheckId.Sitemap)).toMatchObject({
      status: SeoCheckStatus.Ok,
      detail: '2',
      url: sitemapUrl,
    });
  });

  test('reports the news namespace as info when absent', () => {
    const input = {
      ...baseInput,
      sitemaps: [{ url: sitemapUrl, urlCount: 1, hasNews: false }],
    };

    expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
      SeoCheckStatus.Info
    );
  });

  test('errors when the sitemap is missing or not a sitemap', () => {
    const input = {
      ...baseInput,
      sitemaps: [{ url: sitemapUrl, error: 'HTTP 404' }],
    };

    expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
      status: SeoCheckStatus.Error,
      detail: 'HTTP 404',
    });
    expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
      SeoCheckStatus.Info
    );
  });

  describe('with a sitemap index', () => {
    const news = {
      url: 'https://example.com/api/sitemap/news',
      urlCount: 1,
      hasNews: true,
    };
    const pages = {
      url: 'https://example.com/api/sitemap/pages',
      urlCount: 2,
      hasNews: false,
    };

    test('counts the urls of all nested sitemaps', () => {
      const input = { ...baseInput, sitemaps: [news, pages] };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Ok,
        detail: '3',
        url: sitemapUrl,
      });
      expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
        SeoCheckStatus.Ok
      );
    });

    test('reports the news namespace as info when no nested sitemap has it', () => {
      const input = { ...baseInput, sitemaps: [pages] };

      expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
        SeoCheckStatus.Info
      );
    });

    test('errors and names the nested sitemap that failed', () => {
      const input = {
        ...baseInput,
        sitemaps: [
          news,
          {
            url: 'https://example.com/api/sitemap/articles-2020',
            error: 'HTTP 500',
          },
          pages,
        ],
      };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Error,
        detail: 'https://example.com/api/sitemap/articles-2020: HTTP 500',
      });
      expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
        SeoCheckStatus.Ok
      );
    });

    test('reports the real reason when every nested sitemap fails', () => {
      const input = {
        ...baseInput,
        sitemaps: [
          { url: news.url, error: 'The operation was aborted due to timeout' },
          { url: pages.url, error: 'HTTP 503' },
        ],
      };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Error,
        detail: `${news.url}: The operation was aborted due to timeout (+1 more)`,
      });
    });
  });

  test('detects the existing rss feed', () => {
    expect(getCheck(baseInput, SeoCheckId.Feed)).toMatchObject({
      status: SeoCheckStatus.Ok,
      url: 'https://example.com/api/rss-feed',
    });
  });

  test('warns when the rss feed is missing or invalid', () => {
    expect(
      getCheck(
        { ...baseInput, rssFeed: { reachable: false, error: 'ECONNREFUSED' } },
        SeoCheckId.Feed
      )
    ).toMatchObject({ status: SeoCheckStatus.Warning, detail: 'ECONNREFUSED' });

    expect(
      getCheck({ ...baseInput, rssFeed: ok('<html></html>') }, SeoCheckId.Feed)
        ?.status
    ).toBe(SeoCheckStatus.Warning);
  });

  test('lists missing article markup', () => {
    const input = {
      ...baseInput,
      latestArticle: ok(
        '<html><script type="application/ld+json">{"@type":"WebPage"}</script></html>'
      ),
    };

    expect(getCheck(input, SeoCheckId.ArticleMarkup)).toMatchObject({
      status: SeoCheckStatus.Warning,
      detail: 'canonical, NewsArticle',
      url: 'https://example.com/a/foo',
    });
  });

  test('warns when the latest article is unreachable', () => {
    expect(
      getCheck(
        {
          ...baseInput,
          latestArticle: { reachable: true, status: 500, body: '' },
        },
        SeoCheckId.ArticleMarkup
      )
    ).toMatchObject({ status: SeoCheckStatus.Warning, detail: 'HTTP 500' });
  });

  test('reports article markup as info without a published article', () => {
    expect(
      getCheck(
        { ...baseInput, latestArticleUrl: null, latestArticle: null },
        SeoCheckId.ArticleMarkup
      )?.status
    ).toBe(SeoCheckStatus.Info);
  });

  test('warns about missing publication name and logo', () => {
    expect(
      getCheck(
        { ...baseInput, publication: { name: ' ', hasLogo: false } },
        SeoCheckId.PublicationMetadata
      )
    ).toMatchObject({ status: SeoCheckStatus.Warning, detail: 'name, logo' });

    expect(
      getCheck(
        { ...baseInput, publication: null },
        SeoCheckId.PublicationMetadata
      )?.status
    ).toBe(SeoCheckStatus.Warning);
  });
});

describe('getSeoUrls', () => {
  test('builds the sitemap and feed urls without double slashes', () => {
    expect(getSeoUrls('https://example.com/')).toEqual({
      sitemapUrl,
      rssFeedUrl: 'https://example.com/api/rss-feed',
      atomFeedUrl: 'https://example.com/api/atom-feed',
      jsonFeedUrl: 'https://example.com/api/json-feed',
    });
  });
});

describe('parseSitemap', () => {
  test('counts the urls of a urlset and detects the news namespace', async () => {
    await expect(parseSitemap(sitemapUrl, ok(sitemap))).resolves.toEqual({
      url: sitemapUrl,
      urlCount: 2,
      hasNews: true,
    });
  });

  test('understands namespace prefixes', async () => {
    await expect(
      parseSitemap(
        sitemapUrl,
        ok(`<sm:urlset xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
<sm:url><sm:loc>https://example.com</sm:loc></sm:url>
</sm:urlset>`)
      )
    ).resolves.toEqual({ url: sitemapUrl, urlCount: 1, hasNews: false });
  });

  test('returns the nested sitemap urls of a sitemap index', async () => {
    await expect(
      parseSitemap(
        sitemapUrl,
        ok(`<sm:sitemapindex xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
<sm:sitemap><sm:loc>https://example.com/api/sitemap/news</sm:loc></sm:sitemap>
<sm:sitemap>
  <sm:loc> https://example.com/api/sitemap/a?x=1&amp;y=2&#38;z=it&#39;s </sm:loc>
  <sm:lastmod>2026-09-30T20:00:00.000Z</sm:lastmod>
</sm:sitemap>
<sm:sitemap><sm:loc><![CDATA[https://example.com/api/sitemap/pages]]></sm:loc></sm:sitemap>
</sm:sitemapindex>`)
      )
    ).resolves.toEqual({
      url: sitemapUrl,
      locs: [
        'https://example.com/api/sitemap/news',
        "https://example.com/api/sitemap/a?x=1&y=2&z=it's",
        'https://example.com/api/sitemap/pages',
      ],
    });
  });

  test('uses the url after redirects for a sitemap index', async () => {
    await expect(
      parseSitemap(sitemapUrl, {
        reachable: true,
        status: 200,
        body: '<sitemapindex></sitemapindex>',
        url: 'https://www.example.com/api/sitemap',
      })
    ).resolves.toEqual({
      url: 'https://www.example.com/api/sitemap',
      locs: [],
    });
  });

  test('errors when the sitemap is missing or not a sitemap', async () => {
    await expect(
      parseSitemap(sitemapUrl, { reachable: true, status: 404, body: sitemap })
    ).resolves.toEqual({ url: sitemapUrl, error: 'HTTP 404' });

    await expect(
      parseSitemap(sitemapUrl, { reachable: false, error: 'fetch failed' })
    ).resolves.toEqual({ url: sitemapUrl, error: 'fetch failed' });

    for (const body of ['', '<html></html>', '<!doctype html><p>Hi']) {
      await expect(parseSitemap(sitemapUrl, ok(body))).resolves.toEqual({
        url: sitemapUrl,
        error: 'No <urlset> found',
      });
    }
  });
});

describe('SEO_CHECKLIST_ITEM_ID', () => {
  test.each(['gsc-verify', 'shareImages'])('accepts %s', id => {
    expect(SEO_CHECKLIST_ITEM_ID.test(id)).toBe(true);
  });

  test.each(['', 'a b', '<script>', 'x'.repeat(65)])('rejects %s', id => {
    expect(SEO_CHECKLIST_ITEM_ID.test(id)).toBe(false);
  });
});
