import { createFileRoute } from '@tanstack/react-router';
import { legacyRedirectHandler } from '@wepublish/utils/website/tanstack';

/**
 * Legacy Next path. `/api/json-feed` is baked into existing feed-reader
 * subscriptions, already-crawled `<link rel="alternate">` tags and older
 * `robots.txt` copies, so it permanently redirects instead of 404ing.
 */
export const Route = createFileRoute('/api/json-feed')({
  server: {
    handlers: { GET: () => legacyRedirectHandler('/feed.json') },
  },
});
