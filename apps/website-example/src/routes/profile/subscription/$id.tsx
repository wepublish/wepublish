import { createFileRoute } from '@tanstack/react-router';
import { subscriptionRoute } from '@wepublish/utils/website/tanstack';

/** `pages/profile/subscription/[id].tsx` */
export const Route = createFileRoute('/profile/subscription/$id')(
  subscriptionRoute()
);
