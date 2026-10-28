import { createFileRoute } from '@tanstack/react-router';
import { createSitemapFetchHandlers } from '@wepublish/feed/website';
import {
  createSsrClient,
  getSiteUrl,
} from '@wepublish/utils/website/tanstack/server';

import { sitemapConfig } from '../../sitemap';

/**
 * `pages/api/sitemap/[chunk].ts`, under `/sitemap` rather than `/api` so it
 * sits next to the index that links to it — `sitemapConfig.sitemapPath` is
 * what keeps the two in step.
 *
 * Every chunk 404s while the config is in `single` mode, exactly as the Next
 * route did; it is `mode: 'index'` that fills them in.
 */
export const Route = createFileRoute('/sitemap/$chunk')({
  server: {
    handlers: {
      GET: ({ params }) =>
        createSitemapFetchHandlers(sitemapConfig, {
          getClient: createSsrClient,
          getSiteUrl,
        }).sitemapChunk(params.chunk),
    },
  },
});
