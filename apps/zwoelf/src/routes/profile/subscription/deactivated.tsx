import { createFileRoute } from '@tanstack/react-router';
import { deactivatedSubscriptionsRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../../integration/default-head';

/** `pages/profile/subscription/deactivated.tsx` */
export const Route = createFileRoute('/profile/subscription/deactivated')({
  ...deactivatedSubscriptionsRoute(),
  head: defaultHead,
});
