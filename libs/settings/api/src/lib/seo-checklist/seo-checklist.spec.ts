import {
  deriveSeoChecks,
  getSeoUrls,
  getSitemapIndexLocs,
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
  sitemap: ok(sitemap),
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
      url: 'https://example.com/api/sitemap',
    });
  });

  test('reports the news namespace as info when absent', () => {
    const input = {
      ...baseInput,
      sitemap: ok(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url></url></urlset>'
      ),
    };

    expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
      SeoCheckStatus.Info
    );
  });

  test('errors when the sitemap is missing or not a sitemap', () => {
    expect(
      getCheck(
        { ...baseInput, sitemap: { reachable: true, status: 404, body: '' } },
        SeoCheckId.Sitemap
      )
    ).toMatchObject({ status: SeoCheckStatus.Error, detail: 'HTTP 404' });

    expect(
      getCheck(
        { ...baseInput, sitemap: ok('<html></html>') },
        SeoCheckId.Sitemap
      )?.status
    ).toBe(SeoCheckStatus.Error);
  });

  describe('with a sitemap index', () => {
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://example.com/api/sitemap/news</loc></sitemap>
<sitemap><loc>https://example.com/api/sitemap/pages</loc></sitemap>
</sitemapindex>`;

    const newsChunk = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
<url><loc>https://example.com/a/foo</loc></url>
</urlset>`;

    const pagesChunk = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://example.com</loc></url>
<url><loc>https://example.com/about</loc></url>
</urlset>`;

    test('counts the urls of all nested sitemaps', () => {
      const input = {
        ...baseInput,
        sitemap: ok(sitemapIndex),
        nestedSitemaps: [ok(newsChunk), ok(pagesChunk)],
      };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Ok,
        detail: '3',
        url: 'https://example.com/api/sitemap',
      });
      expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
        SeoCheckStatus.Ok
      );
    });

    test('reports the news namespace as info when no nested sitemap has it', () => {
      const input = {
        ...baseInput,
        sitemap: ok(sitemapIndex),
        nestedSitemaps: [ok(pagesChunk)],
      };

      expect(getCheck(input, SeoCheckId.NewsSitemap)?.status).toBe(
        SeoCheckStatus.Info
      );
    });

    test('ignores unreachable nested sitemaps', () => {
      const input = {
        ...baseInput,
        sitemap: ok(sitemapIndex),
        nestedSitemaps: [
          { reachable: false, error: 'timeout' } as const,
          ok(pagesChunk),
        ],
      };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Ok,
        detail: '2',
      });
    });

    test('errors when no nested sitemap is a urlset', () => {
      const input = {
        ...baseInput,
        sitemap: ok(sitemapIndex),
        nestedSitemaps: [{ reachable: true, status: 500, body: '' } as const],
      };

      expect(getCheck(input, SeoCheckId.Sitemap)).toMatchObject({
        status: SeoCheckStatus.Error,
        detail: 'No <urlset> found',
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
      sitemapUrl: 'https://example.com/api/sitemap',
      rssFeedUrl: 'https://example.com/api/rss-feed',
      atomFeedUrl: 'https://example.com/api/atom-feed',
      jsonFeedUrl: 'https://example.com/api/json-feed',
    });
  });
});

describe('getSitemapIndexLocs', () => {
  test('returns the nested sitemap urls of a sitemap index', () => {
    expect(
      getSitemapIndexLocs(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://example.com/api/sitemap/news</loc></sitemap>
<sitemap>
  <loc> https://example.com/api/sitemap/a?x=1&amp;y=2 </loc>
  <lastmod>2026-09-30T20:00:00.000Z</lastmod>
</sitemap>
</sitemapindex>`)
    ).toEqual([
      'https://example.com/api/sitemap/news',
      'https://example.com/api/sitemap/a?x=1&y=2',
    ]);
  });

  test('returns nothing for a plain urlset', () => {
    expect(getSitemapIndexLocs(sitemap)).toEqual([]);
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
