import { createFileRoute } from '@tanstack/react-router';

import { renewalMailRedirect } from '../../integration/legacy-redirects';

/** `next.config.js`: `/p/:path*` -> `/:path*`, temporary. */
export const Route = createFileRoute('/p/$')({
  beforeLoad: renewalMailRedirect,
});
