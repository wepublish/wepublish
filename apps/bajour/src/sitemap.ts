import { SitemapSiteConfig } from '@wepublish/feed/website';

// Published pages that next.config.js redirects elsewhere. A sitemap must only
// list final urls; sitemap.spec.ts keeps this in sync with the redirects.
const REDIRECTED_PAGE_SLUGS = new Set([
  'home',
  'member-uebersicht',
  'goenner-uebersicht',
  'spende',
  'unterstuetzen',
]);

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Bajour',
  description:
    'Bajour ist ein Basler Lokalmedium, das mit Newslettern, Artikeln und Veranstaltungen über das Geschehen in Basel berichtet.',
  mode: 'index',
  homepageSlug: 'home',
  pageUrls: ['/author', '/event', '/login', '/signup', '/mitmachen'],
  filterPage: ({ slug }) => !REDIRECTED_PAGE_SLUGS.has(slug ?? ''),
};
