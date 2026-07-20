import { PageContainer } from '@wepublish/page/website';
import { getApiUrl } from '@wepublish/utils/website';
import { LinkContext } from '@wepublish/website/builder';
import {
  addClientCacheToProps,
  getApiClient,
  HotAndTrendingDocument,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';

export default function Index() {
  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <PageContainer slug={''} />
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const client = getApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: '',
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
    client.query({
      query: HotAndTrendingDocument,
      variables: {
        take: 5,
        start: now.toISOString(),
      },
    }),
  ]);

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
