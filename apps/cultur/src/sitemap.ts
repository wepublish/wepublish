import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Cultur',
  description:
    'cültür ist der Newsletter für Kulturkritik des Vereins ch-intercultur, jeden Freitag im Postfach: Information und Kritik über Kulturschaffen und Kulturleben im Kulturraum Schweiz, in allen Kultursparten.',
  pageUrls: ['/author', '/login', '/signup', '/abo'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
