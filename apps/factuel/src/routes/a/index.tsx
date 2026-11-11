import { createFileRoute } from '@tanstack/react-router';
import { articleListRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/** `pages/a/index.tsx` */
export const Route = createFileRoute('/a/')({
  ...articleListRoute(),
  head: defaultHead,
});
