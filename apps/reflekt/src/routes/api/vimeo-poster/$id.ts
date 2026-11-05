import { createFileRoute } from '@tanstack/react-router';

import { vimeoPosterResponse } from '../../../integration/vimeo-poster';

/**
 * `pages/api/vimeo-poster/[id].ts` — resolves a Vimeo id to its poster image
 * through the oEmbed API and redirects there, cached for a day.
 */
export const Route = createFileRoute('/api/vimeo-poster/$id')({
  server: {
    handlers: {
      GET: ({ params }) => vimeoPosterResponse(params.id),
    },
  },
});
