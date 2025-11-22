import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  HotAndTrendingDocument,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

export default function Index() {
  return <PageContainer slug={''} />;
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
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

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
