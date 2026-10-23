import { createFileRoute } from '@tanstack/react-router';
import { feedHandler } from '@wepublish/utils/website/tanstack';
import { getSiteUrl } from '@wepublish/utils/website/tanstack/server';

import { getFeed } from '../feed';

/**
 * `pages/api/json-feed.ts`, moved to the conventional `/feed.json`. The old path still 301s
 * here so existing feed-reader subscriptions keep working.
 *
 * `[.]` in the filename escapes a literal dot — `.` is the path separator in
 * TanStack route filenames.
 *
 * The `server` block has to be written out literally; see the note at the top
 * of `libs/utils/website/src/tanstack/routes/server-routes.ts`.
 */
export const Route = createFileRoute('/feed.json')({
  server: {
    handlers: {
      GET: ({ request }) => feedHandler(request, getFeed, getSiteUrl, 'json1'),
    },
  },
});
