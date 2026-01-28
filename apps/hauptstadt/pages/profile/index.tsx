import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  getSessionTokenProps,
  ProfilePage,
  ssrAuthLink,
} from '@wepublish/utils/website';
import { getV1ApiClient, PageDocument } from '@wepublish/website/api';
import { NextPageContext } from 'next';
import getConfig from 'next/config';

import { HauptstadtContentFullWidth } from '../../src/components/hauptstadt-content-wrapper';

export default function Profile() {
  return (
    <PageContainer slug="profile">
      <HauptstadtContentFullWidth>
        <ContentWidthProvider fullWidth>
          <ProfilePage mediaEmail="abo@hauptstadt.be" />
        </ContentWidthProvider>
      </HauptstadtContentFullWidth>
    </PageContainer>
  );
}

Profile.getInitialProps = async (ctx: NextPageContext) => {
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
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
