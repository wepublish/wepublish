import { createFileRoute } from '@tanstack/react-router';
import { searchRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../integration/default-head';

/** `pages/search.tsx` */
export const Route = createFileRoute('/search')({
  ...searchRoute(),
  head: defaultHead,
});
