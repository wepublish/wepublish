import { getArticleSEO } from '@wepublish/article/website';
import {
  FullArticleFragment,
  FullPageFragment,
  SlimArticleFragment,
  SlimPageFragment,
} from '@wepublish/website/api';
import { buildUrlset } from './sitemap/xml';

const SITEMAP_MAX_ENTRIES = 49999;

export type SitemapConfig = {
  lang?: string;
  title: string;
  siteUrl: string;
};

/**
 * @deprecated Use `createSitemapHandlers`, which pages through the archive,
 * can split it into a sitemap index and dates the homepage by its teasers.
 */
export const generateSitemap =
  ({ lang = 'de', title, siteUrl }: SitemapConfig) =>
  (
    articles: (FullArticleFragment | SlimArticleFragment)[],
    pages: (FullPageFragment | SlimPageFragment)[],
    pageUrls: string[]
  ) => {
    if (
      articles.length + pages.length + pageUrls.length >
      SITEMAP_MAX_ENTRIES
    ) {
      throw new Error('Too many URLs for sitemap.xml');
    }

    return buildUrlset(
      [
        { loc: siteUrl, changefreq: 'daily', priority: 1 },
        ...pageUrls.map(pageUrl => ({
          loc: pageUrl,
          changefreq: 'weekly' as const,
          priority: 0.8,
        })),
        ...pages.map(page => ({
          loc: page.url,
          lastmod: page.latest.publishedAt,
        })),
        ...articles.map(article => ({
          loc: article.url,
          lastmod: article.latest.publishedAt,
          news: {
            title:
              getArticleSEO(article as FullArticleFragment).socialMediaTitle ??
              '',
            publicationDate: article.publishedAt ?? '',
          },
        })),
      ],
      { name: title, language: lang }
    );
  };
