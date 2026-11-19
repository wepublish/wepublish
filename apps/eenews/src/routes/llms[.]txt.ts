import { createFileRoute } from '@tanstack/react-router';
import { createLlmsTxtFetchHandler } from '@wepublish/feed/website';
import { createSsrClient } from '@wepublish/utils/website/tanstack/server';

import { sitemapConfig } from '../sitemap';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: ({ request }) =>
        createLlmsTxtFetchHandler(sitemapConfig, {
          getClient: createSsrClient,
        })(request),
    },
  },
});
