import { createFileRoute } from '@tanstack/react-router';
import { authorListRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/** `pages/author/index.tsx` */
export const Route = createFileRoute('/author/')({
  ...authorListRoute(),
  head: defaultHead,
});
