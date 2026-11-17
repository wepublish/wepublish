import { SeoCheck, SeoCheckId, SeoCheckStatus } from './seo-checklist.model';

export type SeoProbeResult =
  | { reachable: true; status: number; body: string }
  | { reachable: false; error: string };

export type SeoChecksInput = {
  websiteUrl: string;
  sitemap: SeoProbeResult;
  nestedSitemaps?: SeoProbeResult[];
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

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

export const isSitemapIndex = (body: string) => body.includes('<sitemapindex');

export const getSitemapIndexLocs = (body: string): string[] => {
  if (!isSitemapIndex(body)) {
    return [];
  }

  return [...body.matchAll(/<sitemap>[\s\S]*?<\/sitemap>/g)]
    .map(([entry]) => entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1])
    .filter((loc): loc is string => !!loc)
    .map(loc => decodeXmlEntities(loc.trim()));
};

const isOk = (
  probe: SeoProbeResult | null
): probe is Extract<SeoProbeResult, { reachable: true }> =>
  !!probe && probe.reachable && probe.status >= 200 && probe.status < 300;

const describeFailure = (probe: SeoProbeResult) =>
  'error' in probe ? probe.error : `HTTP ${probe.status}`;

const getUrlsets = (input: SeoChecksInput): string[] => {
  if (!isOk(input.sitemap)) {
    return [];
  }

  const candidates =
    isSitemapIndex(input.sitemap.body) ?
      (input.nestedSitemaps ?? []).filter(isOk).map(probe => probe.body)
    : [input.sitemap.body];

  return candidates.filter(body => body.includes('<urlset'));
};

const checkSitemap = (input: SeoChecksInput): SeoCheck[] => {
  const { sitemapUrl } = getSeoUrls(input.websiteUrl);
  const urlsets = getUrlsets(input);

  if (!urlsets.length) {
    return [
      {
        id: SeoCheckId.Sitemap,
        status: SeoCheckStatus.Error,
        detail:
          isOk(input.sitemap) ? 'No <urlset> found' : (
            describeFailure(input.sitemap)
          ),
        url: sitemapUrl,
      },
      {
        id: SeoCheckId.NewsSitemap,
        status: SeoCheckStatus.Info,
        url: sitemapUrl,
      },
    ];
  }

  const urlCount = urlsets.reduce(
    (count, body) => count + (body.match(/<url>/g) ?? []).length,
    0
  );
  const hasNews = urlsets.some(body => body.includes(NEWS_SITEMAP_NAMESPACE));

  return [
    {
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
