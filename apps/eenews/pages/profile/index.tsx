import { EenewsPageShell, EenewsProfile } from '@wepublish/tenant/eenews';
import { ProfilePage, withAuthGuard } from '@wepublish/utils/website/next';
import { NextPage } from 'next';

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
