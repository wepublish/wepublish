import { parseStringPromise, processors } from 'xml2js';
import { SeoCheck, SeoCheckId, SeoCheckStatus } from './seo-checklist.model';

export type SeoProbeResult =
  | { reachable: true; status: number; body: string; url?: string }
  | { reachable: false; error: string };

export type SitemapResult =
  | { url: string; urlCount: number; hasNews: boolean }
  | { url: string; error: string };

export type SitemapIndex = { url: string; locs: string[] };

export type SeoChecksInput = {
  websiteUrl: string;
  sitemaps: SitemapResult[];
  rssFeed: SeoProbeResult;
  latestArticleUrl: string | null;
  latestArticle: SeoProbeResult | null;
  publication: { name?: string | null; hasLogo: boolean } | null;
};

export const NEWS_SITEMAP_NAMESPACE =
  'http://www.google.com/schemas/sitemap-news/0.9';

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export const getSeoUrls = (websiteUrl: string) => {
  const base = trimTrailingSlash(websiteUrl);

  return {
    sitemapUrl: `${base}/api/sitemap`,
    rssFeedUrl: `${base}/api/rss-feed`,
    atomFeedUrl: `${base}/api/atom-feed`,
    jsonFeedUrl: `${base}/api/json-feed`,
  };
};

const isOk = (
  probe: SeoProbeResult | null
): probe is Extract<SeoProbeResult, { reachable: true }> =>
  !!probe && probe.reachable && probe.status >= 200 && probe.status < 300;

const describeFailure = (probe: SeoProbeResult) =>
  'error' in probe ? probe.error : `HTTP ${probe.status}`;

export const parseSitemap = async (
  url: string,
  probe: SeoProbeResult
): Promise<SitemapResult | SitemapIndex> => {
  if (!isOk(probe)) {
    return { url, error: describeFailure(probe) };
  }

  const xml = await parseStringPromise(probe.body, {
    trim: true,
    tagNameProcessors: [processors.stripPrefix],
  }).catch(() => null);

  if (xml?.sitemapindex !== undefined) {
    return {
      url: probe.url || url,
      locs: (xml.sitemapindex.sitemap ?? [])
        .map((sitemap: { loc?: unknown[] }) => sitemap.loc?.[0])
        .filter(
          (loc: unknown): loc is string => typeof loc === 'string' && !!loc
        ),
    };
  }

  if (xml?.urlset !== undefined) {
    return {
      url,
      urlCount: xml.urlset.url?.length ?? 0,
      hasNews: probe.body.includes(NEWS_SITEMAP_NAMESPACE),
    };
  }

  return { url, error: 'No <urlset> found' };
};

type SitemapFailure = Extract<SitemapResult, { error: string }>;
type Urlset = Exclude<SitemapResult, SitemapFailure>;

const isSitemapFailure = (sitemap: SitemapResult): sitemap is SitemapFailure =>
  'error' in sitemap;

// The root sitemap's failure is shown as is, a nested one with its url.
const describeSitemapFailures = (
  [first, ...rest]: SitemapFailure[],
  sitemapUrl: string
) => {
  if (!first) {
    return 'No <urlset> found';
  }

  const reason =
    first.url === sitemapUrl ? first.error : `${first.url}: ${first.error}`;

  return rest.length ? `${reason} (+${rest.length} more)` : reason;
};

const checkSitemap = (input: SeoChecksInput): SeoCheck[] => {
  const { sitemapUrl } = getSeoUrls(input.websiteUrl);
  const failed = input.sitemaps.filter(isSitemapFailure);
  const urlsets = input.sitemaps.filter(
    (sitemap): sitemap is Urlset => !isSitemapFailure(sitemap)
  );
  const hasNews = urlsets.some(sitemap => sitemap.hasNews);
  const urlCount = urlsets.reduce(
    (count, sitemap) => count + sitemap.urlCount,
    0
  );

  return [
    failed.length || !urlsets.length ?
      {
        id: SeoCheckId.Sitemap,
        status: SeoCheckStatus.Error,
        detail: describeSitemapFailures(failed, sitemapUrl),
        url: sitemapUrl,
      }
    : {
        id: SeoCheckId.Sitemap,
        status: SeoCheckStatus.Ok,
        detail: `${urlCount}`,
        url: sitemapUrl,
      },
    {
      id: SeoCheckId.NewsSitemap,
      status: hasNews ? SeoCheckStatus.Ok : SeoCheckStatus.Info,
      url: sitemapUrl,
    },
  ];
};

const checkFeed = (input: SeoChecksInput): SeoCheck => {
  const { rssFeedUrl } = getSeoUrls(input.websiteUrl);
  const valid =
    isOk(input.rssFeed) && /<(rss|feed)[\s>]/.test(input.rssFeed.body);

  return {
    id: SeoCheckId.Feed,
    status: valid ? SeoCheckStatus.Ok : SeoCheckStatus.Warning,
    detail:
      valid ? undefined
      : isOk(input.rssFeed) ? 'No <rss> found'
      : describeFailure(input.rssFeed),
    url: rssFeedUrl,
  };
};

const hasCanonical = (html: string) =>
  /<link[^>]+rel=["']?canonical["']?[^>]*>/i.test(html);

const hasNewsArticleJsonLd = (html: string) => {
  const scripts = html.matchAll(
    /<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const [, content] of scripts) {
    if (/"@type"\s*:\s*"NewsArticle"/.test(content)) {
      return true;
    }
  }

  return false;
};

const checkArticleMarkup = (input: SeoChecksInput): SeoCheck => {
  if (!input.latestArticleUrl || !input.latestArticle) {
    return { id: SeoCheckId.ArticleMarkup, status: SeoCheckStatus.Info };
  }

  const url = input.latestArticleUrl;

  if (!isOk(input.latestArticle)) {
    return {
      id: SeoCheckId.ArticleMarkup,
      status: SeoCheckStatus.Warning,
      detail: describeFailure(input.latestArticle),
      url,
    };
  }

  const missing = [
    !hasCanonical(input.latestArticle.body) && 'canonical',
    !hasNewsArticleJsonLd(input.latestArticle.body) && 'NewsArticle',
  ].filter((value): value is string => !!value);

  return {
    id: SeoCheckId.ArticleMarkup,
    status: missing.length ? SeoCheckStatus.Warning : SeoCheckStatus.Ok,
    detail: missing.length ? missing.join(', ') : undefined,
    url,
  };
};

const checkPublication = (input: SeoChecksInput): SeoCheck => {
  const missing = [
    !input.publication?.name?.trim() && 'name',
    !input.publication?.hasLogo && 'logo',
  ].filter((value): value is string => !!value);

  return {
    id: SeoCheckId.PublicationMetadata,
    status: missing.length ? SeoCheckStatus.Warning : SeoCheckStatus.Ok,
    detail: missing.length ? missing.join(', ') : undefined,
  };
};

export const deriveSeoChecks = (input: SeoChecksInput): SeoCheck[] => [
  ...checkSitemap(input),
  checkFeed(input),
  checkArticleMarkup(input),
  checkPublication(input),
];

export const SEO_CHECKLIST_ITEM_ID = /^[a-zA-Z0-9-]{1,64}$/;
