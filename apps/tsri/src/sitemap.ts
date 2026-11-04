import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Tsüri.ch',
  description:
    'Das Wichtigste aus Zürich. Dein tägliches Briefing mit News, Geschichten und Tipps aus der Stadt.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
};
