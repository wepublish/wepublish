import styled from '@emotion/styled';
import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

const Frontpage = styled(PageContainer)`
  padding-bottom: ${({ theme }) => theme.spacing(6)};
`;

export default function Index() {
  return (
    <ContentWidthProvider fullWidth>
      <Frontpage slug={''} />
    </ContentWidthProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

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
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
