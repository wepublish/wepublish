import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Bajour',
  description:
    'Bajour ist das publizistische Basler Forum, online und auf der Strasse. Bajour liefert Übersicht, Hintergrund und die moderierte Debatte zur Stärkung der Demokratie.',
  mode: 'index',
  homepageSlug: 'home',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
};
