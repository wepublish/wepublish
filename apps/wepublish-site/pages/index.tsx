import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import { LinkContext } from '@wepublish/website/builder';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import { localizeSlug } from '../src/localize-slug';

export default function Index() {
  const { locale } = useRouter();

  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <ContentWidthProvider fullWidth>
        <PageContainer slug={localizeSlug('', locale)} />
      </ContentWidthProvider>
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: localizeSlug('', locale),
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
