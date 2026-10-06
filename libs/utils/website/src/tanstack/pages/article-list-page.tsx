import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ArticleListContainer } from '@wepublish/article/website';
import { ArticleListDocument } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useMemo } from 'react';
import { z } from 'zod';

import { useQueryParams, useReplaceSearch } from '../router-hooks';

export const DEFAULT_ARTICLE_LIST_TAKE = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

const listVariables = (page: number | undefined, take: number) => ({
  take,
  skip: ((page ?? 1) - 1) * take,
});

export const prefetchArticleList = (
  client: ApolloClient,
  { page, take = DEFAULT_ARTICLE_LIST_TAKE }: { page?: number; take?: number }
) =>
  client.query({
    query: ArticleListDocument,
    variables: listVariables(page, take),
  });

/**
 * Paginated article index — `pages/a/index.tsx` in the Next apps, which was
 * copy-pasted into every tenant.
 */
export function ArticleListPage({
  take = DEFAULT_ARTICLE_LIST_TAKE,
  canonicalUrl = '/a',
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

  const { data } = useQuery(ArticleListDocument, {
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > take) {
      return Math.ceil(data.articles.totalCount / take);
    }

    return 1;
  }, [data?.articles.totalCount, take]);

  return (
    <>
      <ArticleListContainer variables={variables} />

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
