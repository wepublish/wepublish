import {
  SeoCheck,
  SeoCheckId,
  SeoCheckKind,
  SeoCheckStatus,
  SeoChecklist,
} from './seo-checklist.model';

export type SeoProbeResult =
  | { reachable: true; status: number; body: string }
  | { reachable: false; error: string };

export type SeoChecklistInput = {
  websiteUrl: string;
  robots: SeoProbeResult;
  sitemap: SeoProbeResult;
  latestArticleUrl: string | null;
  latestArticle: SeoProbeResult | null;
  publication: { name?: string | null; hasLogo: boolean } | null;
};

export const NEWS_SITEMAP_NAMESPACE =
  'http://www.google.com/schemas/sitemap-news/0.9';

export const getSitemapUrl = (websiteUrl: string) =>
  `${trimTrailingSlash(websiteUrl)}/api/sitemap`;

export const getRobotsUrl = (websiteUrl: string) =>
  `${trimTrailingSlash(websiteUrl)}/robots.txt`;

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const isOk = (
  probe: SeoProbeResult | null
): probe is Extract<SeoProbeResult, { reachable: true }> =>
  !!probe && probe.reachable && probe.status >= 200 && probe.status < 300;

const describeFailure = (probe: SeoProbeResult) =>
  'error' in probe ? probe.error : `HTTP ${probe.status}`;

const getHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

type RobotsGroup = { userAgents: string[]; disallows: string[] };

export const parseRobots = (robots: string) => {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasUserAgent = false;

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();

    if (!line) {
      continue;
    }

    const separator = line.indexOf(':');

    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === 'sitemap') {
      sitemaps.push(value);
      continue;
    }

    if (key === 'user-agent') {
      if (!current || !lastWasUserAgent) {
        current = { userAgents: [], disallows: [] };
        groups.push(current);
      }

      current.userAgents.push(value.toLowerCase());
      lastWasUserAgent = true;
      continue;
    }

    lastWasUserAgent = false;

    if (key === 'disallow' && current) {
      current.disallows.push(value);
    }
  }

  return { groups, sitemaps };
};

const checkRobots = (input: SeoChecklistInput): SeoCheck[] => {
  const robotsUrl = getRobotsUrl(input.websiteUrl);

  if (!isOk(input.robots)) {
    return [
      {
        id: SeoCheckId.Robots,
        kind: SeoCheckKind.Verifiable,
        status: SeoCheckStatus.Error,
        detail: describeFailure(input.robots),
        url: robotsUrl,
      },
      {
        id: SeoCheckId.RobotsSitemap,
        kind: SeoCheckKind.Verifiable,
        status: SeoCheckStatus.Warning,
        url: robotsUrl,
      },
    ];
  }

  const { groups, sitemaps } = parseRobots(input.robots.body);
  const blocksEverything = groups.some(
    group =>
      group.userAgents.some(agent => agent === '*' || agent === 'googlebot') &&
      group.disallows.includes('/')
  );

  const websiteHost = getHost(input.websiteUrl);
  const foreignSitemap = sitemaps.find(
    sitemap => getHost(sitemap) !== websiteHost
  );

  let sitemapCheck: SeoCheck;

  if (!sitemaps.length) {
    sitemapCheck = {
      id: SeoCheckId.RobotsSitemap,
      kind: SeoCheckKind.Verifiable,
      status: SeoCheckStatus.Warning,
      url: robotsUrl,
    };
  } else if (foreignSitemap) {
    sitemapCheck = {
      id: SeoCheckId.RobotsSitemap,
      kind: SeoCheckKind.Verifiable,
      status: SeoCheckStatus.Warning,
      detail: foreignSitemap,
      url: robotsUrl,
    };
  } else {
    sitemapCheck = {
      id: SeoCheckId.RobotsSitemap,
      kind: SeoCheckKind.Verifiable,
      status: SeoCheckStatus.Ok,
      detail: sitemaps.join(', '),
      url: robotsUrl,
    };
  }

  return [
    {
      id: SeoCheckId.Robots,
      kind: SeoCheckKind.Verifiable,
      status: blocksEverything ? SeoCheckStatus.Error : SeoCheckStatus.Ok,
      detail: blocksEverything ? 'Disallow: /' : undefined,
      url: robotsUrl,
    },
    sitemapCheck,
  ];
};

const checkSitemap = (input: SeoChecklistInput): SeoCheck[] => {
  const sitemapUrl = getSitemapUrl(input.websiteUrl);

  if (!isOk(input.sitemap) || !input.sitemap.body.includes('<urlset')) {
    return [
      {
        id: SeoCheckId.Sitemap,
        kind: SeoCheckKind.Verifiable,
        status: SeoCheckStatus.Error,
        detail:
          isOk(input.sitemap) ? 'No <urlset> found' : (
            describeFailure(input.sitemap)
          ),
        url: sitemapUrl,
      },
      {
        id: SeoCheckId.NewsSitemap,
        kind: SeoCheckKind.Verifiable,
        status: SeoCheckStatus.Info,
        url: sitemapUrl,
      },
    ];
  }

  const urlCount = (input.sitemap.body.match(/<url>/g) ?? []).length;
  const hasNews = input.sitemap.body.includes(NEWS_SITEMAP_NAMESPACE);

  return [
    {
      id: SeoCheckId.Sitemap,
      kind: SeoCheckKind.Verifiable,
      status: SeoCheckStatus.Ok,
      detail: `${urlCount}`,
      url: sitemapUrl,
    },
    {
      id: SeoCheckId.NewsSitemap,
      kind: SeoCheckKind.Verifiable,
      status: hasNews ? SeoCheckStatus.Ok : SeoCheckStatus.Info,
      url: sitemapUrl,
    },
  ];
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

const checkArticleMarkup = (input: SeoChecklistInput): SeoCheck[] => {
  const url = input.latestArticleUrl ?? undefined;

  if (!input.latestArticleUrl || !input.latestArticle) {
    return [
      {
        id: SeoCheckId.Canonical,
        kind: SeoCheckKind.Automatic,
        status: SeoCheckStatus.Info,
      },
      {
        id: SeoCheckId.StructuredData,
        kind: SeoCheckKind.Automatic,
        status: SeoCheckStatus.Info,
      },
    ];
  }

  if (!isOk(input.latestArticle)) {
    const detail = describeFailure(input.latestArticle);

    return [
      {
        id: SeoCheckId.Canonical,
        kind: SeoCheckKind.Automatic,
        status: SeoCheckStatus.Warning,
        detail,
        url,
      },
      {
        id: SeoCheckId.StructuredData,
        kind: SeoCheckKind.Automatic,
        status: SeoCheckStatus.Warning,
        detail,
        url,
      },
    ];
  }

  return [
    {
      id: SeoCheckId.Canonical,
      kind: SeoCheckKind.Automatic,
      status:
        hasCanonical(input.latestArticle.body) ?
          SeoCheckStatus.Ok
        : SeoCheckStatus.Warning,
      url,
    },
    {
      id: SeoCheckId.StructuredData,
      kind: SeoCheckKind.Automatic,
      status:
        hasNewsArticleJsonLd(input.latestArticle.body) ?
          SeoCheckStatus.Ok
        : SeoCheckStatus.Warning,
      url,
    },
  ];
};

const checkPublication = (input: SeoChecklistInput): SeoCheck => {
  const missing = [
    !input.publication?.name?.trim() && 'name',
    !input.publication?.hasLogo && 'logo',
  ].filter((value): value is string => !!value);

  return {
    id: SeoCheckId.PublicationMetadata,
    kind: SeoCheckKind.Verifiable,
    status: missing.length ? SeoCheckStatus.Warning : SeoCheckStatus.Ok,
    detail: missing.length ? missing.join(', ') : undefined,
  };
};

export const deriveSeoChecklist = (input: SeoChecklistInput): SeoChecklist => {
  const sitemapUrl = getSitemapUrl(input.websiteUrl);

  return {
    websiteUrl: input.websiteUrl,
    sitemapUrl,
    robotsUrl: getRobotsUrl(input.websiteUrl),
    checks: [
      ...checkRobots(input),
      ...checkSitemap(input),
      ...checkArticleMarkup(input),
      {
        id: SeoCheckId.NoindexHidden,
        kind: SeoCheckKind.Automatic,
        status: SeoCheckStatus.Info,
      },
      checkPublication(input),
      {
        id: SeoCheckId.SearchConsole,
        kind: SeoCheckKind.Manual,
        status: SeoCheckStatus.Info,
        url: sitemapUrl,
      },
    ],
  };
};
