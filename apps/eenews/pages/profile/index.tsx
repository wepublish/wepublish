import { ProfilePage } from '@wepublish/utils/website';

import { EenewsPageShell } from '../../src/components/eenews-page-shell';

export default function Profile() {
  return (
    <EenewsPageShell>
      <ProfilePage />
    </EenewsPageShell>
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
