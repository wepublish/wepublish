import { createFileRoute } from '@tanstack/react-router';
import { createSitemapFetchHandlers } from '@wepublish/feed/website';
import {
  createSsrClient,
  getSiteUrl,
} from '@wepublish/utils/website/tanstack/server';

import { sitemapConfig } from '../sitemap';

/**
 * `pages/api/sitemap.ts`, moved to the conventional `/sitemap.xml`.
 * `/api/sitemap` still 301s here.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        createSitemapFetchHandlers(sitemapConfig, {
          getClient: createSsrClient,
          getSiteUrl,
        }).sitemap(),
    },
  },
});
