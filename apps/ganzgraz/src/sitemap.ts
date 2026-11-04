import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Ganzgraz',
  description:
    'Das Wichtigste aus Graz: Nachrichten, Hintergründe und Themen der Stadt — täglich eingeordnet, kostenlos und persönlich.',
  pageUrls: ['/author', '/login', '/signup', '/abo'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
