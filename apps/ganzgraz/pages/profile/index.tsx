import { ProfilePage } from '@wepublish/utils/website/next';

export default function Profile() {
  return <ProfilePage />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
