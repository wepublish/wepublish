import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Fazetten',
  description:
    'Das Magazin widmet sich dem Thema Vielfalt – Inklusion. Es versteht das Thema breit und deckt fünf Dimensionen ab: Wohlstand, Generationen, Behinderung, Herkunft und Gender.',
  pageUrls: ['/author', '/login', '/signup', '/abo'],
  // Not `/api/sitemap`: this tenant serves its sitemap from `/sitemap.xml`
  // and its chunks from `/sitemap/<chunk>`. Only read in `index` mode.
  sitemapPath: '/sitemap',
};
