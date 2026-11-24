import { createFileRoute } from '@tanstack/react-router';
import { loginCodeRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/**
 * `pages/l/[code].tsx` — the personal login link from a letter or a mail.
 * The code is in the address and the session it opens is part of the page:
 * `no-store` (`cache-rules.ts`) and `no-referrer` (`start.ts`).
 */
export const Route = createFileRoute('/l/$code')({
  ...loginCodeRoute({ next: '/welcome?src=purl' }),
  head: defaultHead,
});
