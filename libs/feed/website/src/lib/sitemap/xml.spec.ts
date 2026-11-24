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
      // < and > are not allowed in urls, so they are percent-encoded
      '<loc>https://example.com/a/?x=1&amp;y=%3C2%3E</loc>'
    );
    expect(xml).toContain('<news:name>Bajour &amp; Co</news:name>');
    expect(xml).toContain(
      '<news:title>Tom &amp; &quot;Jerry&quot;</news:title>'
    );
  });

  it('percent-encodes characters a url may not contain raw', () => {
    // Bajour has pages with slugs like "Basler*in des Tages", and the API
    // returns their url unencoded. A raw space makes the url invalid.
    const xml = buildUrlset([
      { loc: 'https://example.com/Basler*in des Tages' },
      { loc: 'https://example.com/Das Nützliche zum Schluss' },
    ]);

    expect(xml).toContain(
      '<loc>https://example.com/Basler*in%20des%20Tages</loc>'
    );
    expect(xml).toContain(
      '<loc>https://example.com/Das%20N%C3%BCtzliche%20zum%20Schluss</loc>'
    );
  });

  it('keeps urls that are already encoded and the homepage without a trailing slash', () => {
    const xml = buildUrlset([
      { loc: 'https://example.com' },
      { loc: 'https://example.com/a/tag/Basler*in%20des%20Tages' },
      { loc: 'https://example.com/100%' },
    ]);

    expect(xml).toContain('<loc>https://example.com</loc>');
    expect(xml).toContain(
      '<loc>https://example.com/a/tag/Basler*in%20des%20Tages</loc>'
    );
    expect(xml).toContain('<loc>https://example.com/100%25</loc>');
  });

  it('encodes the locations of a sitemap index', () => {
    expect(
      buildSitemapIndex([{ loc: 'https://example.com/a b.xml' }])
    ).toContain('<loc>https://example.com/a%20b.xml</loc>');
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
