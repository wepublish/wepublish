import { createFileRoute } from '@tanstack/react-router';
import { profileRoute } from '@wepublish/utils/website/tanstack';

/** `pages/profile/index.tsx` */
export const Route = createFileRoute('/profile/')({
  ...profileRoute(),
  head: () => ({ meta: [{ title: 'Profil | Gruppetto' }] }),
});
