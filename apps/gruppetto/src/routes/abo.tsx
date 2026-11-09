import { createFileRoute } from '@tanstack/react-router';
import { redirectRoute } from '@wepublish/utils/website/tanstack';

/** Was `next.config.js#redirects()`: `/abo` -> `/mitmachen`, non-permanent. */
export const Route = createFileRoute('/abo')(redirectRoute('/mitmachen'));
