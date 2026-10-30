const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const NEWS_NS = 'http://www.google.com/schemas/sitemap-news/0.9';

export type SitemapChangefreq =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

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
  tag('loc', url.loc) +
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
        tag('loc', sitemap.loc) +
        tag('lastmod', sitemap.lastmod) +
        '</sitemap>'
    ),
    '</sitemapindex>',
  ].join('\n');
