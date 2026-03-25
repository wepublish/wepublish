import { ProfilePage } from '@wepublish/utils/website';

import { Container } from '../../src/components/layout/container';

export default function Profile() {
  return (
    <Container>
      <ProfilePage />
    </Container>
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
