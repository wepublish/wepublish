import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Mannschaft',
  description:
    'Tagesaktuelle Nachrichten, Interviews und Geschichten zu queeren Themen aus Kultur, Lifestyle und Unterhaltung in Deutschland, Österreich und der Schweiz. Aus der Community – für die Community!',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
