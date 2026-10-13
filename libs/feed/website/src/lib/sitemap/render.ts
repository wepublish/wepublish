import { ApolloClient } from '@apollo/client';
import {
  ArticleSort,
  DateFilterComparison,
  PageSort,
  SitemapArticleFragment,
  SitemapArticlesDocument,
  SitemapHomepageDocument,
  SitemapPageFragment,
  SitemapPagesDocument,
  SortOrder,
} from '@wepublish/website/api';
import { homepageLastmod } from './homepage-lastmod';
import {
  articleChunk,
  Period,
  periodOf,
  periodRange,
  SitemapChunk,
} from './partition';
import { buildSitemapIndex, buildUrlset, SitemapUrl } from './xml';

export type SitemapSiteConfig = {
  /** The publication's name, used in Google News entries. */
  title: string;
  lang?: string;
  /**
   * `single`: one sitemap with the newest `maxArticles` articles.
   * `index`: a sitemap index pointing to a news sitemap, a pages sitemap and
   * one sitemap per past year and per month of the current year, which covers
   * the whole archive.
   */
  mode?: 'single' | 'index';
  /** Paths such as `/login`, listed next to the pages. */
  pageUrls?: string[];
  /** Slug of the page rendered as the homepage. */
  homepageSlug?: string;
  /** Articles younger than this get a Google News entry. */
  newsMaxAgeDays?: number;
  /** `single` mode only. */
  maxArticles?: number;
  /** Return false to leave an article out. Peered articles are always left out. */
  filterArticle?: (article: SitemapArticleFragment) => boolean;
  articleUrl?: (article: SitemapArticleFragment, siteUrl: string) => string;
  pageUrl?: (page: SitemapPageFragment, siteUrl: string) => string;
};

export type SitemapClient = Pick<ApolloClient, 'query'>;

export type SitemapContext = {
  client: SitemapClient;
  siteUrl: string;
  now: Date;
};

/** Where the chunk handler is mounted, relative to the site. */
export const SITEMAP_PATH = '/api/sitemap';

// The protocol allows 50,000 urls per sitemap; the API returns at most 100
// nodes per call.
const MAX_URLS = 50_000;
const API_PAGE_SIZE = 100;
const PARALLEL_REQUESTS = 4;
const MAX_NEWS = 1000;

const DEFAULTS = {
  lang: 'de',
  mode: 'single',
  pageUrls: [] as string[],
  homepageSlug: '',
  newsMaxAgeDays: 2,
  maxArticles: 1000,
} satisfies Partial<SitemapSiteConfig>;

type Paginated<T> = { nodes: T[]; pageInfo: { hasNextPage: boolean } };

/** Fetches up to `limit` nodes, a few API pages at a time. */
const fetchAll = async <T>(
  fetchPage: (take: number, skip: number) => Promise<Paginated<T> | undefined>,
  limit: number
): Promise<T[]> => {
  const collected: T[] = [];

  while (collected.length < limit) {
    const skips = Array.from(
      { length: PARALLEL_REQUESTS },
      (_, i) => collected.length + i * API_PAGE_SIZE
    ).filter(skip => skip < limit);
    const results = await Promise.all(
      skips.map(skip => fetchPage(Math.min(API_PAGE_SIZE, limit - skip), skip))
    );

    for (const [i, result] of results.entries()) {
      const nodes = result?.nodes ?? [];
      collected.push(...nodes);

      const take = Math.min(API_PAGE_SIZE, limit - skips[i]);
      if (nodes.length < take || !result?.pageInfo.hasNextPage) {
        return collected;
      }
    }
  }

  return collected;
};

const publishedBetween = (from?: Date, to?: Date) => ({
  ...(from && {
    publicationDateFrom: {
      comparison: DateFilterComparison.GreaterThanOrEqual,
      date: from.toISOString(),
    },
  }),
  ...(to && {
    publicationDateTo: {
      comparison: DateFilterComparison.LowerThan,
      date: to.toISOString(),
    },
  }),
});

const fetchArticles = (
  { client }: SitemapContext,
  { from, to, limit }: { from?: Date; to?: Date; limit: number }
) =>
  fetchAll(async (take, skip) => {
    const { data } = await client.query({
      query: SitemapArticlesDocument,
      variables: {
        take,
        skip,
        filter: publishedBetween(from, to),
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
      },
      fetchPolicy: 'no-cache',
    });

    return data?.articles;
  }, limit);

const fetchPages = ({ client }: SitemapContext) =>
  fetchAll(async (take, skip) => {
    const { data } = await client.query({
      query: SitemapPagesDocument,
      variables: {
        take,
        skip,
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending,
      },
      fetchPolicy: 'no-cache',
    });

    return data?.pages;
  }, MAX_URLS);

type Resolved = Required<
  Omit<SitemapSiteConfig, 'filterArticle' | 'articleUrl' | 'pageUrl'>
> &
  Pick<SitemapSiteConfig, 'filterArticle' | 'articleUrl' | 'pageUrl'>;

const newsCutoff = (config: Resolved, now: Date) =>
  new Date(now.getTime() - config.newsMaxAgeDays * 24 * 60 * 60 * 1000);

const articleUrls = (
  config: Resolved,
  { siteUrl }: SitemapContext,
  articles: SitemapArticleFragment[],
  newsSince?: Date
): SitemapUrl[] =>
  articles
    .filter(article => !article.peerId)
    .filter(article => config.filterArticle?.(article) ?? true)
    .map(article => ({
      loc: config.articleUrl?.(article, siteUrl) ?? article.url,
      lastmod: article.latest.publishedAt,
      news:
        (
          newsSince &&
          article.publishedAt &&
          new Date(article.publishedAt) >= newsSince
        ) ?
          {
            title:
              article.latest.socialMediaTitle ||
              article.latest.seoTitle ||
              article.latest.title ||
              '',
            publicationDate: article.publishedAt,
          }
        : undefined,
    }));

/** The homepage, the static paths and every page but the homepage. */
const pageUrls = async (
  config: Resolved,
  context: SitemapContext
): Promise<SitemapUrl[]> => {
  const { client, siteUrl } = context;
  const [homepage, pages] = await Promise.all([
    client
      .query({
        query: SitemapHomepageDocument,
        variables: { slug: config.homepageSlug },
        fetchPolicy: 'no-cache',
      })
      .then(({ data }) => data?.page)
      // A missing homepage page (the API answers NotFound) only costs the
      // homepage its date, not the whole sitemap.
      .catch(() => undefined),
    fetchPages(context),
  ]);

  return [
    {
      loc: siteUrl,
      lastmod: homepageLastmod(homepage),
      changefreq: 'daily',
      priority: 1,
    },
    ...config.pageUrls.map(
      (path): SitemapUrl => ({
        loc: `${siteUrl}${path}`,
        changefreq: 'weekly',
        priority: 0.8,
      })
    ),
    ...pages
      .filter(({ slug }) => slug !== config.homepageSlug)
      .map(page => ({
        loc: config.pageUrl?.(page, siteUrl) ?? page.url,
        lastmod: page.latest.publishedAt,
      })),
  ];
};

const publication = (config: Resolved) => ({
  name: config.title,
  language: config.lang,
});

const resolve = (config: SitemapSiteConfig): Resolved => ({
  ...DEFAULTS,
  ...config,
});

const renderSingle = async (config: Resolved, context: SitemapContext) => {
  const [pages, articles] = await Promise.all([
    pageUrls(config, context),
    fetchArticles(context, {
      limit: Math.min(config.maxArticles, MAX_URLS),
    }),
  ]);

  return buildUrlset(
    [
      ...pages,
      ...articleUrls(
        config,
        context,
        articles,
        newsCutoff(config, context.now)
      ),
    ].slice(0, MAX_URLS),
    publication(config)
  );
};

/** The first article published at or after `from`, oldest first. */
const firstArticleFrom = async ({ client }: SitemapContext, from?: Date) => {
  const { data } = await client.query({
    query: SitemapArticlesDocument,
    variables: {
      take: 1,
      filter: publishedBetween(from),
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
    },
    fetchPolicy: 'no-cache',
  });

  return data?.articles.nodes[0];
};

/**
 * The periods that contain articles, oldest first: one query per period, as
 * each lookup jumps to the first article after the previous period. Sparse
 * archives (a magazine back to 1929) so skip the empty years.
 */
const periodsWithArticles = async (context: SitemapContext) => {
  const periods: Period[] = [];
  let next = await firstArticleFrom(context);

  while (next?.publishedAt) {
    const period = periodOf(new Date(next.publishedAt), context.now);
    periods.push(period);
    next = await firstArticleFrom(context, periodRange(period).to);
  }

  return periods;
};

const renderIndex = async (context: SitemapContext) => {
  const periods = await periodsWithArticles(context);
  const chunks = ['news', 'pages', ...periods.reverse().map(articleChunk)];

  return buildSitemapIndex(
    chunks.map(chunk => ({ loc: `${context.siteUrl}${SITEMAP_PATH}/${chunk}` }))
  );
};

const isFuture = (period: Period, now: Date) => periodRange(period).from > now;

/** The sitemap at {@link SITEMAP_PATH}: an index or the whole sitemap. */
export const renderSitemap = (
  config: SitemapSiteConfig,
  context: SitemapContext
) => {
  const resolved = resolve(config);

  return resolved.mode === 'index' ?
      renderIndex(context)
    : renderSingle(resolved, context);
};

/** A sitemap listed in the index, or `null` when there is no such sitemap. */
export const renderSitemapChunk = async (
  config: SitemapSiteConfig,
  chunk: SitemapChunk,
  context: SitemapContext
): Promise<string | null> => {
  const resolved = resolve(config);

  if (resolved.mode !== 'index') {
    return null;
  }

  switch (chunk.type) {
    case 'news': {
      const since = newsCutoff(resolved, context.now);
      const articles = await fetchArticles(context, {
        from: since,
        limit: MAX_NEWS,
      });

      return buildUrlset(
        articleUrls(resolved, context, articles, since),
        publication(resolved)
      );
    }

    case 'pages':
      return buildUrlset(await pageUrls(resolved, context));

    case 'articles': {
      if (isFuture(chunk, context.now)) {
        return null;
      }

      const articles = await fetchArticles(context, {
        ...periodRange(chunk),
        limit: MAX_URLS,
      });

      return buildUrlset(articleUrls(resolved, context, articles));
    }
  }
};
