import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return <ProfilePage subscribeAnotherUrl="/upgrade" />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
