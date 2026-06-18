import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';

import { EenewsPageShell } from '../../src/components/eenews-page-shell';
import { EenewsProfile } from '../../src/components/eenews-profile';

function Profile() {
  return (
    <EenewsPageShell>
      <EenewsProfile />
    </EenewsPageShell>
  );
}

const GuardedProfile = withAuthGuard(Profile);
GuardedProfile.getInitialProps = ProfilePage.getInitialProps;

export default GuardedProfile;
