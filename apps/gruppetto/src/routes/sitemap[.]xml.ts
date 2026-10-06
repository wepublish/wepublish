import { createFileRoute } from '@tanstack/react-router';
import { sitemapHandler } from '@wepublish/utils/website/tanstack';
import { getSiteUrl } from '@wepublish/utils/website/tanstack/server';

import { getSitemap } from '../sitemap';

/**
 * `pages/api/sitemap.ts`, moved to the conventional `/sitemap.xml`.
 * `/api/sitemap` still 301s here.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => sitemapHandler(getSitemap, getSiteUrl),
    },
  },
});
