import { createFileRoute } from '@tanstack/react-router';
import { confirmEmailRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../integration/default-head';

/** `pages/confirm-email.tsx` — the link in the email-change confirmation. */
export const Route = createFileRoute('/confirm-email')({
  ...confirmEmailRoute(),
  head: defaultHead,
});
