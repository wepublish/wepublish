import { createFileRoute } from '@tanstack/react-router';
import { confirmEmailRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../integration/default-head';
import { withEenewsPageShell } from '../integration/with-page-shell';

const route = confirmEmailRoute();

/** `pages/confirm-email.tsx` — the link in the email-change confirmation. */
export const Route = createFileRoute('/confirm-email')({
  ...route,
  component: withEenewsPageShell(route.component),
  head: defaultHead,
});
