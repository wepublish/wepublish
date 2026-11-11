import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage, profileRoute } from '@wepublish/utils/website/tanstack';

import { defaultHead } from '../../integration/default-head';

const CourantProfilePage = () => (
  <div className="courant-profile-page">
    <ProfilePage />
  </div>
);

/** `pages/profile/index.tsx` */
export const Route = createFileRoute('/profile/')({
  ...profileRoute(),
  component: CourantProfilePage,
  head: defaultHead,
});
