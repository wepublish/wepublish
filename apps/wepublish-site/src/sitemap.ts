import { SitemapSiteConfig } from '@wepublish/feed/website';

import { localizeSlug } from './localize-slug';
import { locales, localizeUrl } from './localize-url';

const staticPaths = ['/author', '/event', '/login', '/signup', '/mitmachen'];

export const sitemapConfig: SitemapSiteConfig = {
  title: 'We.Publish',
  homepageSlug: localizeSlug('', 'de'),
  pageUrls: locales.flatMap(locale =>
    staticPaths.map(path => `/${locale}${path}`)
  ),
  articleUrl: ({ slug }, siteUrl) => localizeUrl(siteUrl, slug, 'article'),
  pageUrl: ({ slug }, siteUrl) => localizeUrl(siteUrl, slug, 'page'),
};
