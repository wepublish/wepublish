import { createFileRoute } from '@tanstack/react-router';
import { pageByIdRoute } from '@wepublish/utils/website/tanstack';

import { withEenewsPageShell } from '../../integration/with-page-shell';

/** `pages/id/[id].tsx` */
const route = pageByIdRoute();

export const Route = createFileRoute('/id/$id')({
  ...route,
  component: withEenewsPageShell(route.component),
});
