import { createFileRoute } from '@tanstack/react-router';
import { pageBySlugRoute } from '@wepublish/utils/website/tanstack';

import { withEenewsPageShell } from '../integration/with-page-shell';

/** `pages/[slug].tsx` */
const route = pageBySlugRoute();

export const Route = createFileRoute('/$slug')({
  ...route,
  component: withEenewsPageShell(route.component),
});
