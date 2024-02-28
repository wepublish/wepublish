import {getArticleSEO} from '@wepublish/article/website'
import {Article} from '@wepublish/website/api'

const SITEMAP_MAX_ENTRIES = 49999

export type SitemapConfig = {
  lang?: string
  title: string
  siteUrl: string
}

export const generateSitemap =
  ({lang = 'de', title, siteUrl}: SitemapConfig) =>
  (articles: Article[], pageUrls: string[]) => {
    if (articles.length + pageUrls.length > SITEMAP_MAX_ENTRIES) {
      throw new Error('Too many URLs for sitemap.xml')
    }

    const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

        <url>
            <loc>${siteUrl}</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
        </url>

        ${pageUrls.map(
          pageUrl =>
            `<url>
                <loc>${pageUrl}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>`
        )}

        ${articles.map(article => {
          const seo = getArticleSEO(article)

          return `
            <url>
                <loc>${article.url}</loc>

                <news:news>
                    <news:publication>
                        <news:name>${title}</news:name>
                        <news:language>${lang}</news:language>
                    </news:publication>

                    <news:publication_date>${article.publishedAt}</news:publication_date>
                    <news:title>${seo.socialMediaTitle}</news:title>
                </news:news>
            </url>
        `
        })}
    </urlset>
    `

    return sitemap.trim()
  }
