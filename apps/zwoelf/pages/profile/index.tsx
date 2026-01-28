import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return <ProfilePage mediaEmail="info@wepublish.dev" />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
