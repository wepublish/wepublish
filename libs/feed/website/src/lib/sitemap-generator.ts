import { getArticleSEO } from '@wepublish/article/website';
import { Article, Page } from '@wepublish/website/api';
import { escape } from 'lodash';

const SITEMAP_MAX_ENTRIES = 49999;

export type SitemapConfig = {
  lang?: string;
  title: string;
  siteUrl: string;
  newsMaxAgeDays?: number;
  homepageLastmod?: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const generateSitemap =
  ({
    lang = 'de',
    title,
    siteUrl,
    newsMaxAgeDays,
    homepageLastmod,
  }: SitemapConfig) =>
  (articles: Article[], pages: Page[], pageUrls: string[]) => {
    if (
      articles.length + pages.length + pageUrls.length >
      SITEMAP_MAX_ENTRIES
    ) {
      throw new Error('Too many URLs for sitemap.xml');
    }

    const newsCutoff =
      newsMaxAgeDays == null ? null : Date.now() - newsMaxAgeDays * MS_PER_DAY;

    const qualifiesAsNews = (publishedAt?: string | null) => {
      if (newsCutoff == null) {
        return true;
      }

      const published = new Date(publishedAt ?? '').getTime();

      return Number.isFinite(published) && published >= newsCutoff;
    };

    const mostRecentPublishedAt = [
      ...articles.map(article => article.latest.publishedAt),
      ...pages.map(page => page.latest.publishedAt),
    ]
      .filter(Boolean)
      .sort()
      .at(-1);

    const homepageLastmodTag =
      homepageLastmod && mostRecentPublishedAt ?
        `<lastmod>${mostRecentPublishedAt}</lastmod>`
      : '';

    const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

        <url>
            <loc>${siteUrl}</loc>
            ${homepageLastmodTag}
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
        </url>

        ${pageUrls
          .map(
            pageUrl =>
              `<url>
                <loc>${pageUrl}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>`
          )
          .join('\n')}

          ${pages
            .map(page => {
              return `
              <url>
                  <loc>${page.url}</loc>
                  <lastmod>${page.latest.publishedAt}</lastmod>
              </url>
          `;
            })
            .join('\n')}

        ${articles
          .map(article => {
            const seo = getArticleSEO(article);

            return `
            <url>
                <loc>${article.url}</loc>
                <lastmod>${article.latest.publishedAt}</lastmod>
${
  qualifiesAsNews(article.publishedAt) ?
    `
                <news:news>
                    <news:publication>
                        <news:name>${escape(title)}</news:name>
                        <news:language>${lang}</news:language>
                    </news:publication>

                    <news:publication_date>${article.publishedAt}</news:publication_date>
                    <news:title>${escape(seo.socialMediaTitle ?? '')}</news:title>
                </news:news>`
  : ''
}
            </url>
        `;
          })
          .join('\n')}
    </urlset>
    `;

    return sitemap.trim();
  };
