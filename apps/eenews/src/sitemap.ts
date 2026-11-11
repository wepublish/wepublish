import { SitemapSiteConfig } from '@wepublish/feed/website';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'ee-news',
  description:
    'EE-News ist ein unabhängiges Schweizer Medium zu erneuerbaren Energien, Energieeffizienz und Klima.',
  mode: 'index',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
};
