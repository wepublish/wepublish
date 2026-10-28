import { createFileRoute } from '@tanstack/react-router';
import { eventListRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

/** `pages/event/index.tsx` */
export const Route = createFileRoute('/event/')({
  ...eventListRoute(),
  head: defaultHead,
});
