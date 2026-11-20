import { createFileRoute } from '@tanstack/react-router';
import { deactivatedSubscriptionsRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../../integration/default-head';
import { withEenewsPageShell } from '../../../integration/with-page-shell';

/** `pages/profile/subscription/deactivated.tsx` */
const route = deactivatedSubscriptionsRoute();

export const Route = createFileRoute('/profile/subscription/deactivated')({
  ...route,
  component: withEenewsPageShell(route.component),
  head: defaultHead,
});
