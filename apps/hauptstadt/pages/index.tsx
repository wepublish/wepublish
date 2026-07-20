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
import { Link } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';

export default function Index() {
  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <ContentWidthProvider fullWidth>
        <PageContainer slug={''} />

        <Link
          href="/a?page=2"
          css={{ justifySelf: 'center', fontWeight: 400 }}
        >
          Ältere Hauptstadt-Artikel
        </Link>
      </ContentWidthProvider>
    </LinkContext.Provider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
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

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
