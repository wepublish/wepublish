import { createFileRoute } from '@tanstack/react-router';
import { deactivatedSubscriptionsRoute } from '@wepublish/utils/website/tanstack';

/** `pages/profile/subscription/deactivated.tsx` */
export const Route = createFileRoute('/profile/subscription/deactivated')(
  deactivatedSubscriptionsRoute()
);
