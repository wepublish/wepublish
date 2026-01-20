import { css, Global } from '@emotion/react';
import { ProfilePage } from '@wepublish/utils/website';

import theme from '../../src/theme';

export default function Profile() {
  return (
    <>
      <Global
        styles={css`
          .tsri-profile-page {
            padding-top: ${theme.spacing(2)};
          }
        `}
      />
      <ProfilePage
        mediaEmail="info@tsri.ch"
        fields={['firstName', 'address', 'password', 'image']}
        className="tsri-profile-page"
      />
    </>
  );
}

Profile.getInitialProps = ProfilePage.getInitialProps;
