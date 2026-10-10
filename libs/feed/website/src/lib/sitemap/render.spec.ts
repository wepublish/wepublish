import {
  ArticleFilter,
  DateFilter,
  DateFilterComparison,
  SitemapArticleFragment,
  SitemapArticlesDocument,
  SitemapHomepageDocument,
  SitemapPageFragment,
  SitemapPagesDocument,
  SortOrder,
} from '@wepublish/website/api';
import { DocumentNode } from 'graphql';
import {
  renderSitemap,
  renderSitemapChunk,
  SitemapClient,
  SitemapSiteConfig,
} from './render';

const siteUrl = 'https://example.com';
const now = new Date('2026-10-08T12:00:00.000Z');
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const article = (
  id: string,
  publishedAt: string,
  extra: Partial<SitemapArticleFragment> = {}
): SitemapArticleFragment => ({
  __typename: 'Article',
  id,
  slug: id,
  url: `${siteUrl}/a/${id}`,
  peerId: null,
  publishedAt,
  tags: [],
  latest: {
    __typename: 'ArticleRevision',
    publishedAt,
    title: `Title ${id}`,
    seoTitle: null,
    socialMediaTitle: null,
  },
  ...extra,
});

const page = (slug: string, publishedAt: string): SitemapPageFragment => ({
  __typename: 'Page',
  id: slug || 'home',
  slug,
  url: `${siteUrl}/${slug}`,
  publishedAt,
  latest: { __typename: 'PageRevision', publishedAt },
});

const matchesDate = (value: string, filter: DateFilter | null | undefined) => {
  if (!filter?.date) {
    return true;
  }

  const date = new Date(value).getTime();
  const bound = new Date(filter.date).getTime();

  switch (filter.comparison) {
    case DateFilterComparison.GreaterThanOrEqual:
      return date >= bound;
    case DateFilterComparison.LowerThan:
      return date < bound;
    default:
      throw new Error(`unexpected comparison ${filter.comparison}`);
  }
};

/** Behaves like the API: filters by publication date, sorts, caps take at 100. */
const fakeClient = ({
  articles = [] as SitemapArticleFragment[],
  pages = [] as SitemapPageFragment[],
  homepageBlocks = [] as unknown[],
}) => {
  const list = <T extends { publishedAt?: string | null }>(
    nodes: T[],
    variables: {
      filter?: Pick<ArticleFilter, 'publicationDateFrom' | 'publicationDateTo'>;
      take?: number;
      skip?: number;
      order?: SortOrder;
    }
  ) => {
    const take = Math.min(variables.take ?? 10, 100);
    const skip = variables.skip ?? 0;
    const matching = nodes
      .filter(
        node =>
          matchesDate(
            node.publishedAt!,
            variables.filter?.publicationDateFrom
          ) &&
          matchesDate(node.publishedAt!, variables.filter?.publicationDateTo)
      )
      .sort(
        (a, b) =>
          (variables.order === SortOrder.Ascending ? 1 : -1) *
          (new Date(a.publishedAt!).getTime() -
            new Date(b.publishedAt!).getTime())
      );

    return {
      nodes: matching.slice(skip, skip + take),
      pageInfo: { hasNextPage: skip + take < matching.length },
    };
  };

  const query = vi.fn(
    async ({
      query,
      variables,
    }: {
      query: DocumentNode;
      variables?: Record<string, unknown>;
    }) => {
      if (query === SitemapArticlesDocument) {
        return { data: { articles: list(articles, variables ?? {}) } };
      }

      if (query === SitemapPagesDocument) {
        return { data: { pages: list(pages, variables ?? {}) } };
      }

      if (query === SitemapHomepageDocument) {
        const homepage = pages.find(({ slug }) => slug === variables?.slug);

        // like the API, which answers a missing page with NotFoundException
        if (!homepage) {
          throw new Error(`Page with slug ${variables?.slug} was not found.`);
        }

        return {
          data: {
            page: {
              id: homepage.id,
              latest: {
                publishedAt: homepage.latest.publishedAt,
                blocks: homepageBlocks,
              },
            },
          },
        };
      }

      throw new Error('unexpected query');
    }
  );

  return { query } as unknown as SitemapClient & { query: typeof query };
};

const locs = (xml: string | null) =>
  [...(xml ?? '').matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) => loc);

const urlEntry = (xml: string | null, loc: string) =>
  (xml ?? '').split('\n').find(line => line.includes(`<loc>${loc}</loc>`));

const config: SitemapSiteConfig = {
  title: 'Example',
  pageUrls: ['/login', '/signup'],
};

describe('single mode', () => {
  it('lists the homepage with the date of its newest teaser', async () => {
    const client = fakeClient({
      pages: [page('', hoursAgo(500))],
      articles: [
        article('old', hoursAgo(400)),
        article('teased', hoursAgo(300)),
      ],
      homepageBlocks: [
        {
          __typename: 'TeaserGridBlock',
          teasers: [
            {
              __typename: 'ArticleTeaser',
              article: { id: 'teased', latest: { publishedAt: hoursAgo(300) } },
            },
          ],
        },
      ],
    });

    const xml = await renderSitemap(config, { client, siteUrl, now });

    expect(locs(xml)[0]).toBe(siteUrl);
    expect(urlEntry(xml, siteUrl)).toContain(
      `<lastmod>${hoursAgo(300)}</lastmod>`
    );
  });

  it('lists the homepage without a date when there is no homepage page', async () => {
    const client = fakeClient({ articles: [article('a1', hoursAgo(5))] });

    const xml = await renderSitemap(config, { client, siteUrl, now });

    expect(locs(xml)[0]).toBe(siteUrl);
    expect(urlEntry(xml, siteUrl)).not.toContain('<lastmod>');
  });

  it('lists the static paths, the pages and the newest articles', async () => {
    const client = fakeClient({
      pages: [page('', hoursAgo(500)), page('about', hoursAgo(450))],
      articles: [article('a1', hoursAgo(200)), article('a2', hoursAgo(100))],
    });

    const xml = await renderSitemap(config, { client, siteUrl, now });

    expect(locs(xml)).toEqual([
      siteUrl,
      `${siteUrl}/login`,
      `${siteUrl}/signup`,
      `${siteUrl}/about`,
      `${siteUrl}/a/a2`,
      `${siteUrl}/a/a1`,
    ]);
  });

  it('pages through the API up to maxArticles', async () => {
    const client = fakeClient({
      articles: Array.from({ length: 250 }, (_, i) =>
        article(`a${i}`, hoursAgo(1000 + i))
      ),
    });

    const all = await renderSitemap(config, { client, siteUrl, now });
    const capped = await renderSitemap(
      { ...config, maxArticles: 120 },
      { client, siteUrl, now }
    );

    expect(locs(all).filter(loc => loc.includes('/a/'))).toHaveLength(250);
    expect(locs(capped).filter(loc => loc.includes('/a/'))).toHaveLength(120);
  });

  it('marks only recent articles as news', async () => {
    const client = fakeClient({
      articles: [article('fresh', hoursAgo(5)), article('stale', hoursAgo(72))],
    });

    const xml = await renderSitemap(config, { client, siteUrl, now });

    expect(urlEntry(xml, `${siteUrl}/a/fresh`)).toContain('<news:news>');
    expect(urlEntry(xml, `${siteUrl}/a/stale`)).not.toContain('<news:news>');
  });

  it('leaves out peered articles and those the media filters out', async () => {
    const client = fakeClient({
      articles: [
        article('own', hoursAgo(5)),
        article('peered', hoursAgo(5), { peerId: 'peer-1' }),
        article('archived', hoursAgo(5), {
          tags: [{ __typename: 'Tag', id: 't1', tag: 'archiviert' }],
        }),
      ],
    });

    const xml = await renderSitemap(
      {
        ...config,
        filterArticle: ({ tags }) =>
          !tags.some(({ tag }) => tag === 'archiviert'),
      },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toContain(`${siteUrl}/a/own`);
    expect(locs(xml)).not.toContain(`${siteUrl}/a/peered`);
    expect(locs(xml)).not.toContain(`${siteUrl}/a/archived`);
  });

  it('lets the media build its own urls', async () => {
    const client = fakeClient({
      pages: [page('about-fr', hoursAgo(5))],
      articles: [article('news-fr', hoursAgo(5))],
    });

    const xml = await renderSitemap(
      {
        ...config,
        articleUrl: ({ slug }, base) => `${base}/fr/a/${slug}`,
        pageUrl: ({ slug }, base) => `${base}/fr/${slug}`,
      },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toContain(`${siteUrl}/fr/a/news-fr`);
    expect(locs(xml)).toContain(`${siteUrl}/fr/about-fr`);
  });

  it('serves no chunks', async () => {
    const client = fakeClient({});

    expect(
      await renderSitemapChunk(
        config,
        { type: 'pages' },
        { client, siteUrl, now }
      )
    ).toBeNull();
  });
});

describe('index mode', () => {
  const indexConfig: SitemapSiteConfig = { ...config, mode: 'index' };

  it('points to news, pages and every year or current month with articles', async () => {
    const client = fakeClient({
      articles: [
        article('1929', '1929-11-01T12:00:00.000Z'),
        article('1931', '1931-02-01T12:00:00.000Z'),
        article('2025a', '2025-01-10T12:00:00.000Z'),
        article('2025b', '2025-12-31T23:00:00.000Z'),
        article('aug', '2026-08-15T10:00:00.000Z'),
        article('oct', '2026-10-01T10:00:00.000Z'),
      ],
    });

    const xml = await renderSitemap(indexConfig, { client, siteUrl, now });

    expect(xml).toContain('<sitemapindex');
    expect(locs(xml)).toEqual([
      `${siteUrl}/api/sitemap/news`,
      `${siteUrl}/api/sitemap/pages`,
      `${siteUrl}/api/sitemap/articles-2026-10`,
      `${siteUrl}/api/sitemap/articles-2026-08`,
      `${siteUrl}/api/sitemap/articles-2025`,
      `${siteUrl}/api/sitemap/articles-1931`,
      `${siteUrl}/api/sitemap/articles-1929`,
    ]);
  });

  it('points to news and pages only without articles', async () => {
    const xml = await renderSitemap(indexConfig, {
      client: fakeClient({}),
      siteUrl,
      now,
    });

    expect(locs(xml)).toEqual([
      `${siteUrl}/api/sitemap/news`,
      `${siteUrl}/api/sitemap/pages`,
    ]);
  });

  it('lists every article of a past year', async () => {
    const client = fakeClient({
      articles: [
        article('2025a', '2025-01-01T00:00:00.000Z'),
        article('2025b', '2025-12-31T23:59:59.000Z'),
        article('2024', '2024-12-31T23:59:59.000Z'),
        article('2026', '2026-01-01T00:00:00.000Z'),
      ],
    });

    const xml = await renderSitemapChunk(
      indexConfig,
      { type: 'articles', year: 2025 },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toEqual([`${siteUrl}/a/2025b`, `${siteUrl}/a/2025a`]);
  });

  it('lists every article of a month, and only those', async () => {
    const client = fakeClient({
      articles: [
        ...Array.from({ length: 230 }, (_, i) =>
          article(
            `sep${i}`,
            `2026-09-${String((i % 30) + 1).padStart(2, '0')}T10:00:00.000Z`
          )
        ),
        article('aug', '2026-08-31T23:59:59.000Z'),
        article('oct', '2026-10-01T00:00:00.000Z'),
      ],
    });

    const xml = await renderSitemapChunk(
      indexConfig,
      { type: 'articles', year: 2026, month: 9 },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toHaveLength(230);
    expect(locs(xml)).not.toContain(`${siteUrl}/a/aug`);
    expect(locs(xml)).not.toContain(`${siteUrl}/a/oct`);
    expect(xml).not.toContain('news:');
  });

  it('lists recent articles as news', async () => {
    const client = fakeClient({
      articles: [article('fresh', hoursAgo(5)), article('stale', hoursAgo(72))],
    });

    const xml = await renderSitemapChunk(
      indexConfig,
      { type: 'news' },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toEqual([`${siteUrl}/a/fresh`]);
    expect(xml).toContain('<news:name>Example</news:name>');
    expect(xml).toContain('<news:title>Title fresh</news:title>');
  });

  it('lists the homepage, static paths and pages', async () => {
    const client = fakeClient({
      pages: [page('', hoursAgo(500)), page('about', hoursAgo(450))],
      articles: [article('a1', hoursAgo(5))],
    });

    const xml = await renderSitemapChunk(
      indexConfig,
      { type: 'pages' },
      { client, siteUrl, now }
    );

    expect(locs(xml)).toEqual([
      siteUrl,
      `${siteUrl}/login`,
      `${siteUrl}/signup`,
      `${siteUrl}/about`,
    ]);
  });

  it.each([
    { type: 'articles', year: 2026, month: 11 },
    { type: 'articles', year: 2027 },
  ] as const)('has no sitemap for the future %o', async chunk => {
    expect(
      await renderSitemapChunk(indexConfig, chunk, {
        client: fakeClient({}),
        siteUrl,
        now,
      })
    ).toBeNull();
  });
});
