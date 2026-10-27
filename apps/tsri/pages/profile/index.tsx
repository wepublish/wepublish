import styled from '@emotion/styled';
import { tsriTheme as theme } from '@wepublish/tenant/tsri';
import { ProfilePage } from '@wepublish/utils/website';

const TsriProfilePage = styled(ProfilePage)`
  &:is(SubscriptionsWrapper) {
    padding-top: ${theme.spacing(2)};
  }
`;

export default function Profile() {
  return (
    <TsriProfilePage
      fields={['firstName', 'address', 'password', 'image']}
      className="tsri-profile-page"
    />
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
