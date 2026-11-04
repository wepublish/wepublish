import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'WNTI',
  description:
    'Das neue digitale Stadtmagazin. Wir berichten über das, was Winterthur beschäftigt – fundiert, unabhängig und nahbar.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/mitmachen'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
