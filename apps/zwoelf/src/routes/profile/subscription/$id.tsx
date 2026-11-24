import { createFileRoute } from '@tanstack/react-router';
import { subscriptionRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../../integration/default-head';

/** `pages/profile/subscription/[id].tsx` */
export const Route = createFileRoute('/profile/subscription/$id')({
  ...subscriptionRoute(),
  head: defaultHead,
});
