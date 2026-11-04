import { useQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';
import { EenewsTagPage } from '@wepublish/tenant/eenews';
import {
  ApolloRouterContext,
  mergeApolloCache,
  pageSearchSchema,
  useReplaceSearch,
} from '@wepublish/utils/website/tanstack';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
} from '@wepublish/website/api';
import { BuilderTagProps } from '@wepublish/website/builder';

import {
  DOSSIER_TAKE,
  loadEenewsDossierIndex,
} from '../../../integration/tag-queries';

/**
 * `pages/a/tag/index.tsx` — the dossier index.
 *
 * It has no tag of its own: the list is every article carrying one of the
 * whitelisted tags, and `EenewsTagPage` is handed an empty tag result so it
 * renders the listing chrome without a tag header.
 */
export const Route = createFileRoute('/a/tag/')({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search: { page } }: { search: { page?: number } }) => ({
    page,
  }),
  loader: async ({
    context: { apolloClient },
    deps: { page },
  }: {
    context: ApolloRouterContext;
    deps: { page?: number };
  }) => {
    const { apollo, whitelistTagIds } = await loadEenewsDossierIndex({
      data: { page },
    });

    mergeApolloCache(apolloClient, apollo);

    return { whitelistTagIds };
  },
  component: DossierIndex,
});

function DossierIndex() {
  const { whitelistTagIds } = Route.useLoaderData();
  const { page = 1 } = Route.useSearch();
  const replaceSearch = useReplaceSearch();

  const variables: Partial<ArticleListQueryVariables> = {
    take: DOSSIER_TAKE,
    skip: (page - 1) * DOSSIER_TAKE,
    filter: whitelistTagIds.length ? { tags: whitelistTagIds } : undefined,
  };

  const articles = useQuery(ArticleListDocument, {
    fetchPolicy: 'cache-and-network',
    variables,
  });

  return (
    <EenewsTagPage
      tag={
        {
          data: undefined,
          loading: false,
          error: undefined,
        } as BuilderTagProps['tag']
      }
      articles={
        {
          data: articles.data,
          loading: articles.loading,
          error: undefined,
        } as BuilderTagProps['articles']
      }
      variables={variables}
      onVariablesChange={next => {
        replaceSearch(previous => ({
          ...previous,
          page: next?.skip && next?.take ? next.skip / next.take + 1 : 1,
        }));
      }}
    />
  );
}
