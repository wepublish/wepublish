import { createFileRoute } from '@tanstack/react-router';
import { redirectRoute } from '@wepublish/utils/website/tanstack';

/** `next.config.js`: `/profile/subscription` -> `/profile`, permanent. */
export const Route = createFileRoute('/profile/subscription/')(
  redirectRoute('/profile', { permanent: true })
);
