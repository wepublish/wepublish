import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import { revalidateFor, getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { LinkContext } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
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
  if (!getApiUrl()) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  const [page] = await Promise.all([
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
    revalidate: revalidateFor(page.data?.page, page.errors),
  };
};
