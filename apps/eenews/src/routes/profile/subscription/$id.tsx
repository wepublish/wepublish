import { createFileRoute } from '@tanstack/react-router';
import { EenewsSubscriptionDetail } from '@wepublish/tenant/eenews';
import {
  subscriptionRoute,
  withAuthGuard,
} from '@wepublish/utils/website/tanstack';

import { withEenewsPageShell } from '../../../integration/with-page-shell';

/**
 * `pages/profile/subscription/[id].tsx` — ee-news's own subscription detail,
 * not the shared one.
 */
export const Route = createFileRoute('/profile/subscription/$id')({
  ...subscriptionRoute(),
  component: withAuthGuard(withEenewsPageShell(EenewsSubscriptionDetail)),
});
