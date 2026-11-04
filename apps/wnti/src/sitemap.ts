import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'WNTI',
  description: 'WNTI ist ein digitales Stadtmagazin für Winterthur.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
