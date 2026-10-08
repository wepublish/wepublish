import { SitemapSiteConfig } from '@wepublish/feed/website';
import { isArchived, isNachtleben } from './archiviert';

export const sitemapConfig: SitemapSiteConfig = {
  title: 'Hauptstadt',
  mode: 'index',
  // archived articles (/archive/…) are disallowed in robots.txt and nachtleben
  // article urls permanently redirect to /ausgang-in-bern — neither belongs
  // in the sitemap
  filterArticle: ({ tags }) => !isArchived(tags) && !isNachtleben(tags),
  pageUrls: [
    '/author',
    '/event',
    '/login',
    '/signup',
    '/mitmachen',
    '/ausgang-in-bern',
  ],
};
