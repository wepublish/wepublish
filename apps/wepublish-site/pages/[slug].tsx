import { CombinedGraphQLErrors } from '@apollo/client';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl,revalidateFor } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PageDocument,
  PageQuery,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { localizeSlug } from '../src/localize-slug';

export default function PageBySlugOrId() {
  const {
    locale,
    query: { slug, id },
  } = useRouter();

  const containerProps = {
    slug: localizeSlug(slug, locale),
    id,
  } as ComponentProps<typeof PageContainer>;

  return <PageContainer {...containerProps} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug?.toString();
  const id = params?.id?.toString();
  const client = getApiClient(getApiUrl(), []);
  const [page] = await Promise.all([
    client.query<PageQuery>({
      query: PageDocument,
      variables: {
        slug: localizeSlug(slug, locale),
        id,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const is404 =
    CombinedGraphQLErrors.is(page.error) &&
    page.error.errors.find(({ extensions }) => extensions?.status === 404);
  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate:
      !page.data?.page ? 1 : revalidateFor(page.data.page, page.error),
  };
};
