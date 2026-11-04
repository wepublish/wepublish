import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'ee-news',
  description:
    'EE-News ist unabhängiger Journalismus zu erneuerbaren Energien, Energieeffizienz und Klima — mit Fokus Schweiz, Blick auf die Welt.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
};
