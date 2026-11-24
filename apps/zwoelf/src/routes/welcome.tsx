import { createFileRoute } from '@tanstack/react-router';
import { welcomeRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../integration/default-head';

/**
 * `pages/welcome.tsx` — the steps after a personal login link. Loads the
 * reader on the server: `no-store`, see `cache-rules.ts`.
 */
export const Route = createFileRoute('/welcome')({
  ...welcomeRoute(),
  head: defaultHead,
});
