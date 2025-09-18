import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return <ProfilePage mediaEmail="abo@gruppetto-magazin.ch" />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
