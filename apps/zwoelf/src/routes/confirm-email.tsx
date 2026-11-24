import { createFileRoute } from '@tanstack/react-router';
import { confirmEmailRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../integration/default-head';

/**
 * `pages/confirm-email.tsx` — the link in the email-change confirmation. The
 * reader goes on with the welcome steps, where the address was entered.
 */
export const Route = createFileRoute('/confirm-email')({
  ...confirmEmailRoute({ redirectTo: '/welcome?emailConfirmed=1' }),
  head: defaultHead,
});
