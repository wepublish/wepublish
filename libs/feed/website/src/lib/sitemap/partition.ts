export type Period = { year: number; month?: number };

export type SitemapChunk =
  { type: 'news' } | { type: 'pages' } | ({ type: 'articles' } & Period);

export type CacheableSitemap = SitemapChunk | { type: 'index' };

export const periodOf = (date: Date, now: Date): Period =>
  date.getUTCFullYear() < now.getUTCFullYear() ?
    { year: date.getUTCFullYear() }
  : { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };

export const periodRange = ({ year, month }: Period) =>
  month ?
    {
      from: new Date(Date.UTC(year, month - 1, 1)),
      to: new Date(Date.UTC(year, month, 1)),
    }
  : {
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year + 1, 0, 1)),
    };

export const articleChunk = ({ year, month }: Period) =>
  month ?
    `articles-${year}-${String(month).padStart(2, '0')}`
  : `articles-${year}`;

const ARTICLE_CHUNK = /^articles-(\d{4})(?:-(\d{2}))?$/;

export const parseChunk = (name: string | undefined): SitemapChunk | null => {
  if (name === 'news' || name === 'pages') {
    return { type: name };
  }

  const match = name?.match(ARTICLE_CHUNK);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  if (match[2] === undefined) {
    return { type: 'articles', year };
  }

  const month = Number(match[2]);

  return month >= 1 && month <= 12 ? { type: 'articles', year, month } : null;
};

const SETTLED =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800';
const LIVE =
  'public, max-age=300, s-maxage=600, stale-while-revalidate=600, stale-if-error=86400';

const startOfMonth = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

export const cacheControlFor = (sitemap: CacheableSitemap, now: Date) =>
  sitemap.type === 'articles' && periodRange(sitemap).to <= startOfMonth(now) ?
    SETTLED
  : LIVE;
