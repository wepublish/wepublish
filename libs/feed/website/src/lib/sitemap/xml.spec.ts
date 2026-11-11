import { buildSitemapIndex, buildUrlset } from './xml';

describe('buildUrlset', () => {
  it('lists every url with its optional fields', () => {
    const xml = buildUrlset([
      {
        loc: 'https://example.com',
        lastmod: '2026-10-01T08:00:00.000Z',
        changefreq: 'daily',
        priority: 1,
      },
      { loc: 'https://example.com/login' },
    ]);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      '<url><loc>https://example.com</loc><lastmod>2026-10-01T08:00:00.000Z</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>'
    );
    expect(xml).toContain('<url><loc>https://example.com/login</loc></url>');
  });

  it('escapes every text node, including the location', () => {
    const xml = buildUrlset(
      [
        {
          loc: 'https://example.com/a/?x=1&y=<2>',
          news: {
            title: 'Tom & "Jerry"',
            publicationDate: '2026-10-01T08:00:00.000Z',
          },
        },
      ],
      { name: 'Bajour & Co', language: 'de' }
    );

    expect(xml).toContain(
      '<loc>https://example.com/a/?x=1&amp;y=&lt;2&gt;</loc>'
    );
    expect(xml).toContain('<news:name>Bajour &amp; Co</news:name>');
    expect(xml).toContain(
      '<news:title>Tom &amp; &quot;Jerry&quot;</news:title>'
    );
  });

  it('adds the news namespace and entries only when given a publication', () => {
    const withNews = buildUrlset(
      [
        {
          loc: 'https://example.com/a/1',
          news: { title: 'T', publicationDate: '2026-10-01T08:00:00.000Z' },
        },
      ],
      { name: 'Example', language: 'fr' }
    );
    const withoutNews = buildUrlset([
      {
        loc: 'https://example.com/a/1',
        news: { title: 'T', publicationDate: '2026-10-01T08:00:00.000Z' },
      },
    ]);

    expect(withNews).toContain(
      'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'
    );
    expect(withNews).toContain('<news:language>fr</news:language>');
    expect(withNews).toContain(
      '<news:publication_date>2026-10-01T08:00:00.000Z</news:publication_date>'
    );
    expect(withoutNews).not.toContain('news:');
  });

  it('omits empty lastmods', () => {
    expect(
      buildUrlset([{ loc: 'https://example.com', lastmod: null }])
    ).not.toContain('lastmod');
  });
});

describe('buildSitemapIndex', () => {
  it('lists the sitemaps', () => {
    const xml = buildSitemapIndex([
      { loc: 'https://example.com/api/sitemap/pages' },
      {
        loc: 'https://example.com/api/sitemap/articles-2026-09',
        lastmod: '2026-09-30T20:00:00.000Z',
      },
    ]);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(xml).toContain(
      '<sitemap><loc>https://example.com/api/sitemap/pages</loc></sitemap>'
    );
    expect(xml).toContain(
      '<sitemap><loc>https://example.com/api/sitemap/articles-2026-09</loc><lastmod>2026-09-30T20:00:00.000Z</lastmod></sitemap>'
    );
  });
});
