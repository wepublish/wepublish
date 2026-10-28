import { createFileRoute } from '@tanstack/react-router';
import { authorRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/** `pages/author/[slug].tsx` */
export const Route = createFileRoute('/author/$slug')({
  ...authorRoute(),
  head: defaultHead,
});
