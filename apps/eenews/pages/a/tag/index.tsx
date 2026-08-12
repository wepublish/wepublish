import { ApolloError, ApolloQueryResult } from '@apollo/client';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  ArticleListQuery,
  ArticleListQueryVariables,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagListDocument,
  TagListQuery,
  TagQuery,
  useArticleListQuery,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { EenewsTagPage } from '../../../src/components/eenews-tag-page';
import { resolveWhitelistTagIds } from '../../../src/components/teasers/eenews-teaser-selectors';

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

type DossierIndexProps = {
  whitelistTagIds?: string[];
};

export default function DossierIndex({
  whitelistTagIds = [],
}: DossierIndexProps) {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables: Partial<ArticleListQueryVariables> = {
    take: TAKE,
    skip: (page - 1) * TAKE,
    filter: whitelistTagIds.length ? { tags: whitelistTagIds } : undefined,
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

  const client = getApiClient(getApiUrl(), []);

  const tagListResult = await client.query<TagListQuery>({
    query: TagListDocument,
    variables: { take: 100 },
  });
  const whitelistTagIds = resolveWhitelistTagIds(
    tagListResult.data?.tags?.nodes ?? []
  );

  const filter = whitelistTagIds.length ? { tags: whitelistTagIds } : undefined;

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: { take: TAKE, skip: 0, filter },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const props = addClientCacheToProps(client, { whitelistTagIds });

  return {
    props,
    revalidate: 60,
  };
};
