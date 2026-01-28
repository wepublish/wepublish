import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

export default function Index() {
  return (
    <ContentWidthProvider fullWidth>
      <PageContainer slug={''} />

      <Link
        href="/a?page=2"
        css={{ justifySelf: 'center', fontWeight: 400 }}
      >
        Ältere Hauptstadt-Artikel
      </Link>
    </ContentWidthProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  const [page] = await Promise.all([
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
