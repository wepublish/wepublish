import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsPageShell } from '../../src/components/eenews-page-shell';
import { EenewsProfile } from '../../src/components/eenews-profile';

function Profile() {
  return (
    <EenewsPageShell>
      <EenewsProfile />
    </EenewsPageShell>
  );
}

const GuardedProfile = withAuthGuard(Profile) as NextPage;
GuardedProfile.getInitialProps = (
  ProfilePage as unknown as NextPage
).getInitialProps;

export default GuardedProfile;
