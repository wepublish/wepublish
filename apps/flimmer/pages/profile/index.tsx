import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return (
    <ProfilePage
      mediaEmail="redaktion@flimmer.media"
      fields={['firstName', 'address', 'password', 'image']}
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
