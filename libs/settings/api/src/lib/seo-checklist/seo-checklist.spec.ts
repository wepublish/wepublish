import {
  deriveSeoChecklist,
  parseRobots,
  SeoChecklistInput,
  SeoProbeResult,
} from './seo-checklist';
import {
  SeoCheckId,
  SeoCheckKind,
  SeoCheckStatus,
} from './seo-checklist.model';

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

const baseInput: SeoChecklistInput = {
  websiteUrl: 'https://example.com',
  robots: ok(
    'User-agent: *\nAllow: /\n\nSitemap: https://example.com/api/sitemap'
  ),
  sitemap: ok(sitemap),
  latestArticleUrl: 'https://example.com/a/foo',
  latestArticle: ok(articleHtml),
  publication: { name: 'Example', hasLogo: true },
};

const getCheck = (input: SeoChecklistInput, id: SeoCheckId) =>
  deriveSeoChecklist(input).checks.find(check => check.id === id);

describe('deriveSeoChecklist', () => {
  test('reports a healthy setup', () => {
    const checklist = deriveSeoChecklist(baseInput);

    expect(checklist.sitemapUrl).toBe('https://example.com/api/sitemap');
    expect(checklist.robotsUrl).toBe('https://example.com/robots.txt');
    expect(
      checklist.checks
        .filter(check => check.kind !== SeoCheckKind.Manual)
        .filter(check => check.id !== SeoCheckId.NoindexHidden)
        .map(check => [check.id, check.status])
    ).toEqual([
      [SeoCheckId.Robots, SeoCheckStatus.Ok],
      [SeoCheckId.RobotsSitemap, SeoCheckStatus.Ok],
      [SeoCheckId.Sitemap, SeoCheckStatus.Ok],
      [SeoCheckId.NewsSitemap, SeoCheckStatus.Ok],
      [SeoCheckId.Canonical, SeoCheckStatus.Ok],
      [SeoCheckId.StructuredData, SeoCheckStatus.Ok],
      [SeoCheckId.PublicationMetadata, SeoCheckStatus.Ok],
    ]);
  });

  test('classifies checks by kind', () => {
    const kinds = Object.fromEntries(
      deriveSeoChecklist(baseInput).checks.map(check => [check.id, check.kind])
    );

    expect(kinds).toEqual({
      [SeoCheckId.Robots]: SeoCheckKind.Verifiable,
      [SeoCheckId.RobotsSitemap]: SeoCheckKind.Verifiable,
      [SeoCheckId.Sitemap]: SeoCheckKind.Verifiable,
      [SeoCheckId.NewsSitemap]: SeoCheckKind.Verifiable,
      [SeoCheckId.Canonical]: SeoCheckKind.Automatic,
      [SeoCheckId.StructuredData]: SeoCheckKind.Automatic,
      [SeoCheckId.NoindexHidden]: SeoCheckKind.Automatic,
      [SeoCheckId.PublicationMetadata]: SeoCheckKind.Verifiable,
      [SeoCheckId.SearchConsole]: SeoCheckKind.Manual,
    });
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

  test('errors when robots.txt blocks all crawlers', () => {
    const input = {
      ...baseInput,
      robots: ok('User-agent: *\nDisallow: /'),
    };

    expect(getCheck(input, SeoCheckId.Robots)).toMatchObject({
      status: SeoCheckStatus.Error,
      detail: 'Disallow: /',
    });
  });

  test('does not flag partial disallow rules', () => {
    const input = {
      ...baseInput,
      robots: ok(
        'User-agent: *\nDisallow: /*?*\nDisallow: /archive/\n\nUser-agent: BadBot\nDisallow: /\nSitemap: https://example.com/api/sitemap'
      ),
    };

    expect(getCheck(input, SeoCheckId.Robots)?.status).toBe(SeoCheckStatus.Ok);
  });

  test('warns when robots.txt points to a sitemap on another host', () => {
    const input = {
      ...baseInput,
      robots: ok(
        'User-agent: *\nAllow: /\nSitemap: https://wepublish.ch/api/sitemap'
      ),
    };

    expect(getCheck(input, SeoCheckId.RobotsSitemap)).toMatchObject({
      status: SeoCheckStatus.Warning,
      detail: 'https://wepublish.ch/api/sitemap',
    });
  });

  test('warns when robots.txt has no sitemap line', () => {
    const input = { ...baseInput, robots: ok('User-agent: *\nAllow: /') };

    expect(getCheck(input, SeoCheckId.RobotsSitemap)?.status).toBe(
      SeoCheckStatus.Warning
    );
  });

  test('errors when the website is unreachable', () => {
    const unreachable: SeoProbeResult = {
      reachable: false,
      error: 'ECONNREFUSED',
    };
    const input = {
      ...baseInput,
      robots: unreachable,
      sitemap: unreachable,
      latestArticle: unreachable,
    };

    expect(getCheck(input, SeoCheckId.Robots)).toMatchObject({
      status: SeoCheckStatus.Error,
      detail: 'ECONNREFUSED',
    });
    expect(getCheck(input, SeoCheckId.Sitemap)?.status).toBe(
      SeoCheckStatus.Error
    );
    expect(getCheck(input, SeoCheckId.Canonical)?.status).toBe(
      SeoCheckStatus.Warning
    );
  });

  test('warns when the article page lacks canonical or NewsArticle markup', () => {
    const input = {
      ...baseInput,
      latestArticle: ok(
        '<html><script type="application/ld+json">{"@type":"WebPage"}</script></html>'
      ),
    };

    expect(getCheck(input, SeoCheckId.Canonical)?.status).toBe(
      SeoCheckStatus.Warning
    );
    expect(getCheck(input, SeoCheckId.StructuredData)?.status).toBe(
      SeoCheckStatus.Warning
    );
  });

  test('reports article markup as info without a published article', () => {
    const input = { ...baseInput, latestArticleUrl: null, latestArticle: null };

    expect(getCheck(input, SeoCheckId.Canonical)?.status).toBe(
      SeoCheckStatus.Info
    );
    expect(getCheck(input, SeoCheckId.StructuredData)?.status).toBe(
      SeoCheckStatus.Info
    );
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

  test('search console is always a manual step pointing to the sitemap', () => {
    expect(getCheck(baseInput, SeoCheckId.SearchConsole)).toMatchObject({
      kind: SeoCheckKind.Manual,
      status: SeoCheckStatus.Info,
      url: 'https://example.com/api/sitemap',
    });
  });

  test('handles trailing slashes in the website url', () => {
    expect(
      deriveSeoChecklist({ ...baseInput, websiteUrl: 'https://example.com/' })
        .sitemapUrl
    ).toBe('https://example.com/api/sitemap');
  });
});

describe('parseRobots', () => {
  test('groups consecutive user-agents and collects sitemaps', () => {
    expect(
      parseRobots(
        '# comment\nUser-agent: a\nUser-agent: B\nDisallow: /x\nUser-agent: c\nDisallow:\nSitemap: https://example.com/s'
      )
    ).toEqual({
      groups: [
        { userAgents: ['a', 'b'], disallows: ['/x'] },
        { userAgents: ['c'], disallows: [''] },
      ],
      sitemaps: ['https://example.com/s'],
    });
  });
});
