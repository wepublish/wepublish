import { ApolloError, ApolloQueryResult } from '@apollo/client';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  ArticleListQuery,
  ArticleListQueryVariables,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagQuery,
  useArticleListQuery,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { EenewsTagPage } from '../../../src/components/eenews-tag-page';

const TAKE = 24;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional().default(1),
});

type ApolloResult<T> = {
  data: T | undefined;
  loading: boolean;
  error: ApolloError | undefined;
};

function toApolloResult<T>(
  data: T | undefined,
  loading: boolean
): ApolloResult<T> {
  return { data, loading, error: undefined };
}

export default function DossierIndex() {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables: Partial<ArticleListQueryVariables> = {
    take: TAKE,
    skip: (page - 1) * TAKE,
  };

  const articlesQuery = useArticleListQuery({
    fetchPolicy: 'cache-and-network',
    variables,
  });

  const tagResult = toApolloResult<TagQuery>(undefined, false);
  const articlesResult = toApolloResult<ArticleListQuery>(
    articlesQuery.data,
    articlesQuery.loading
  );

  return (
    <EenewsTagPage
      tag={tagResult as unknown as ApolloQueryResult<TagQuery>}
      articles={
        articlesResult as unknown as ApolloQueryResult<ArticleListQuery>
      }
      variables={variables}
      onVariablesChange={next => {
        const nextPage =
          next?.skip && next?.take ? next.skip / next.take + 1 : 1;
        replace({ query: { ...query, page: nextPage } }, undefined, {
          shallow: true,
          scroll: true,
        });
      }}
    />
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: { take: TAKE, skip: 0 },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60,
  };
};
