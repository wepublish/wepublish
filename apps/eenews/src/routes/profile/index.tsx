import { createFileRoute } from '@tanstack/react-router';
import { EenewsProfile } from '@wepublish/tenant/eenews';
import { profileRoute, withAuthGuard } from '@wepublish/utils/website/tanstack';

import { withEenewsPageShell } from '../../integration/with-page-shell';

/** `pages/profile/index.tsx` — ee-news's own profile, not the shared one. */
export const Route = createFileRoute('/profile/')({
  ...profileRoute(),
  component: withAuthGuard(withEenewsPageShell(EenewsProfile)),
  head: () => ({ meta: [{ title: 'Profil | EE News' }] }),
});
