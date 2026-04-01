import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return <ProfilePage />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
