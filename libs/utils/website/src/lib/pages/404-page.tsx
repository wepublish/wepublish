import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { getApiUrl } from '../api-url';

const fourOhFourSlug = '404';

export function FourOhFourPage() {
  return <PageContainer slug={fourOhFourSlug} />;
}

export const getFourOhFourStaticProps: GetStaticProps = async () => {
  const client = getApiClient(getApiUrl(), []);
  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: {
        slug: fourOhFourSlug,
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
    revalidate: !page.data?.page ? 1 : 60, // every 60 seconds
  };
};
