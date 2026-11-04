import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Munotglöggli',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
