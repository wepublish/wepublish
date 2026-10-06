import { CombinedGraphQLErrors } from '@apollo/client';
import { ArticleContainer } from '@wepublish/article/website';
import { getApiUrl,revalidateFor } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { localizeSlug } from '../../src/localize-slug';

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
    locale,
  } = useRouter();

  const containerProps = {
    slug: slug ? localizeSlug(slug, locale) : undefined,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return <ArticleContainer {...containerProps} />;
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const id = params?.id?.toString();
  const slug = params?.slug?.toString();
  const localizedSlug = slug ? localizeSlug(slug, locale) : undefined;
  const client = getApiClient(getApiUrl(), []);

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
        id,
        slug: localizedSlug,
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
    CombinedGraphQLErrors.is(article.error) &&
    article.error.errors.find(({ extensions }) => extensions?.status === 404);

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: revalidateFor(article.data?.article, article.error),
  };
};
