import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  getApiUrl,
  getSessionTokenProps,
  ProfilePage,
  ssrAuthLink,
} from '@wepublish/utils/website';
import { getApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';

import { HauptstadtContentFullWidth } from '../../src/components/hauptstadt-content-wrapper';

export default function Profile() {
  return (
    <PageContainer slug="profile">
      <HauptstadtContentFullWidth>
        <ContentWidthProvider fullWidth>
          <ProfilePage />
        </ContentWidthProvider>
      </HauptstadtContentFullWidth>
    </PageContainer>
  );
}

Profile.getInitialProps = async (ctx: NextPageContext) => {
  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'profile',
      },
    }),
  ]);

  return ProfilePage.getInitialProps?.(ctx);
};
