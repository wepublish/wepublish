import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { ProfilePage } from '@wepublish/utils/website/next';

export default function Profile() {
  return (
    <Container>
      <ProfilePage />
    </Container>
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
