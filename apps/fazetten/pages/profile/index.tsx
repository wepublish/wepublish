import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return <ProfilePage mediaEmail="info@wepublish.ch" />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
