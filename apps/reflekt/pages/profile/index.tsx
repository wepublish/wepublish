import { ProfilePage } from '@wepublish/utils/website/next';

export default function Profile() {
  return <ProfilePage subscribeAnotherUrl="/upgrade" />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
