import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage, profileRoute } from '@wepublish/utils/website/tanstack';

/** `pages/profile/index.tsx` — "another subscription" means an upgrade here. */
export const Route = createFileRoute('/profile/')({
  ...profileRoute(),
  component: () => <ProfilePage subscribeAnotherUrl="/upgrade" />,
  head: () => ({ meta: [{ title: 'Profil | Reflekt' }] }),
});
