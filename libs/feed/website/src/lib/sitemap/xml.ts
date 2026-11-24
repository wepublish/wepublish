const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const NEWS_NS = 'http://www.google.com/schemas/sitemap-news/0.9';

export type SitemapChangefreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export type SitemapUrl = {
  loc: string;
  lastmod?: string | null;
  changefreq?: SitemapChangefreq;
  priority?: number;
  news?: { title: string; publicationDate: string };
};

export type NewsPublication = { name: string; language: string };

export type SitemapReference = { loc: string; lastmod?: string | null };

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escape = (value: string) =>
  value.replace(/[&<>"']/g, char => XML_ENTITIES[char]);

const tag = (name: string, value: string | null | undefined) =>
  value ? `<${name}>${escape(value)}</${name}>` : '';

// Characters an url may contain as they are (RFC 3986), plus already
// percent-encoded triplets. Everything else (spaces, umlauts, a lone %) is
// percent-encoded. The API hands out page and article urls with the slug
// unencoded, e.g. "https://bajour.ch/Basler*in des Tages".
const UNSAFE_URL_CHAR =
  /%(?![0-9A-Fa-f]{2})|[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]/gu;

const encodeUrl = (url: string) =>
  url.replace(UNSAFE_URL_CHAR, char => encodeURIComponent(char));

const locTag = (url: string) => tag('loc', encodeUrl(url));

const newsTag = (
  news: SitemapUrl['news'],
  publication: NewsPublication | undefined
) =>
  news && publication ?
    '<news:news><news:publication>' +
    tag('news:name', publication.name) +
    tag('news:language', publication.language) +
    '</news:publication>' +
    tag('news:publication_date', news.publicationDate) +
    tag('news:title', news.title) +
    '</news:news>'
  : '';

const urlTag = (url: SitemapUrl, publication: NewsPublication | undefined) =>
  '<url>' +
  locTag(url.loc) +
  tag('lastmod', url.lastmod) +
  tag('changefreq', url.changefreq) +
  tag('priority', url.priority?.toFixed(1)) +
  newsTag(url.news, publication) +
  '</url>';

export const buildUrlset = (
  urls: SitemapUrl[],
  publication?: NewsPublication
) =>
  [
    XML_DECLARATION,
    `<urlset xmlns="${SITEMAP_NS}"${publication ? ` xmlns:news="${NEWS_NS}"` : ''}>`,
    ...urls.map(url => urlTag(url, publication)),
    '</urlset>',
  ].join('\n');

export const buildSitemapIndex = (sitemaps: SitemapReference[]) =>
  [
    XML_DECLARATION,
    `<sitemapindex xmlns="${SITEMAP_NS}">`,
    ...sitemaps.map(
      sitemap =>
        '<sitemap>' +
        locTag(sitemap.loc) +
        tag('lastmod', sitemap.lastmod) +
        '</sitemap>'
    ),
    '</sitemapindex>',
  ].join('\n');
