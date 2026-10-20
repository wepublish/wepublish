import { ProfilePage } from '@wepublish/utils/website';

export default function Profile() {
  // readers may switch from invoice to online payment when renewing early
  return <ProfilePage allowPaymentMethodChoice />;
}

Profile.getInitialProps = ProfilePage.getInitialProps;
