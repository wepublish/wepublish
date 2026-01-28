import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return (
    <ProfilePage
      mediaEmail="info@tsri.ch"
      fields={['firstName', 'address', 'password', 'image']}
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
