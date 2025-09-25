import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  return (
    <ProfilePage
      mediaEmail="abo@mannschaft.com"
      fields={[
        'firstName',
        'address',
        'birthday',
        'image',
        'password',
        'flair',
      ]}
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
