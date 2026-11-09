import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Bajour',
  description:
    'Bajour ist ein Basler Lokalmedium, das mit Newslettern, Artikeln und Veranstaltungen über das Geschehen in Basel berichtet.',
  mode: 'index',
  homepageSlug: 'home',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
};
