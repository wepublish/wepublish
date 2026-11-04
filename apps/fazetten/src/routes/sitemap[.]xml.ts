import { createFileRoute } from '@tanstack/react-router';
import { createSitemapFetchHandlers } from '@wepublish/feed/website';
import { createSsrClient } from '@wepublish/utils/website/tanstack/server';

import { sitemapConfig } from '../sitemap';

/**
 * `pages/api/sitemap.ts`, moved to the conventional `/sitemap.xml`.
 * `/api/sitemap` still 301s here.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: ({ request }) =>
        createSitemapFetchHandlers(sitemapConfig, {
          getClient: createSsrClient,
        }).sitemap(request),
    },
  },
});
