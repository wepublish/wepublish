import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { AuthorListContainer } from '@wepublish/author/website';
import {
  AuthorListDocument,
  AuthorSort,
  SortOrder,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useMemo } from 'react';
import { z } from 'zod';

import { useQueryParams, useReplaceSearch } from '../router-hooks';

export const DEFAULT_AUTHOR_LIST_TAKE = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

const listVariables = (page: number | undefined, take: number) => ({
  sort: AuthorSort.Name,
  order: SortOrder.Ascending,
  take,
  skip: ((page ?? 1) - 1) * take,
  filter: { hideOnTeam: false },
});

export const prefetchAuthorList = (
  client: ApolloClient,
  { page, take = DEFAULT_AUTHOR_LIST_TAKE }: { page?: number; take?: number }
) =>
  client.query({
    query: AuthorListDocument,
    variables: listVariables(page, take),
  });

/** `pages/author/index.tsx` */
export function AuthorListPage({
  take = DEFAULT_AUTHOR_LIST_TAKE,
  canonicalUrl = '/author',
}: {
  take?: number;
  canonicalUrl?: string;
}) {
  const {
    Head,
    elements: { Pagination },
  } = useWebsiteBuilder();

  const { page } = pageSchema.parse(useQueryParams());
  const replaceSearch = useReplaceSearch();

  const variables = useMemo(() => listVariables(page, take), [page, take]);

  const { data } = useQuery(AuthorListDocument, {
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.authors.totalCount && data?.authors.totalCount > take) {
      return Math.ceil(data.authors.totalCount / take);
    }

    return 1;
  }, [data?.authors.totalCount, take]);

  return (
    <>
      <AuthorListContainer variables={variables} />

      {pageCount > 1 && (
        <>
          <Head>
            <link
              rel="canonical"
              key="canonical"
              href={canonicalUrl}
            />
          </Head>

          <Pagination
            page={page ?? 1}
            count={pageCount}
            onChange={(_, value) =>
              replaceSearch(previous => ({ ...previous, page: value }))
            }
          />
        </>
      )}
    </>
  );
}
