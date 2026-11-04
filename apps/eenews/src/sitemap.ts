import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'ee-news',
  mode: 'index',
  // `/author` and `/event` were in the Next config but this tenant has never
  // served either, so they are dropped rather than carried over as 404s.
  pageUrls: ['/login', '/signup', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
