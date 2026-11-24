import { createFileRoute } from '@tanstack/react-router';
import { profileRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/** `pages/profile/index.tsx` */
export const Route = createFileRoute('/profile/')({
  ...profileRoute(),
  head: defaultHead,
});
