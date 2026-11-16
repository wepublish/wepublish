import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'We.Publish',
  description:
    'Beispiel-Website von We.Publish, einer Open-Source-Plattform für unabhängige Medien.',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
