import { SitemapSiteConfig } from '@wepublish/feed/website';

import { localizeSlug } from './localize-slug';
import { locales, localizeUrl } from './localize-url';

const staticPaths = ['/author', '/event', '/login', '/signup', '/mitmachen'];

export const sitemapConfig: SitemapSiteConfig = {
  title: 'We.Publish',
  description:
    'We.Publish ist die Open-Source-Infrastruktur, auf der unabhängige Medien publizieren und Inhalte austauschen.',
  homepageSlug: localizeSlug('', 'de'),
  pageUrls: locales.flatMap(locale =>
    staticPaths.map(path => `/${locale}${path}`)
  ),
  articleUrl: ({ slug }, siteUrl) => localizeUrl(siteUrl, slug, 'article'),
  pageUrl: ({ slug }, siteUrl) => localizeUrl(siteUrl, slug, 'page'),
};
