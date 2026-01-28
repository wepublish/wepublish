import styled from '@emotion/styled';
import { ProfilePage } from '@wepublish/utils/website';

import theme from '../../src/theme';

const TsriProfilePage = styled(ProfilePage)`
  &:is(SubscriptionsWrapper) {
    padding-top: ${theme.spacing(2)};
  }
`;

export default function Profile() {
  return (
    <TsriProfilePage
      mediaEmail="info@tsri.ch"
      fields={['firstName', 'address', 'password', 'image']}
      className="tsri-profile-page"
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
