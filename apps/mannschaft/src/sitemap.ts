import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Mannschaft',
  description:
    'Mannschaft ist ein LGBTIQ-Nachrichtenportal mit Nachrichten, Interviews und Geschichten zu queeren Themen aus Deutschland, Österreich und der Schweiz.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
