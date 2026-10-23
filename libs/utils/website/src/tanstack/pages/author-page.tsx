import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { AuthorContainer } from '@wepublish/author/website';
import {
  ArticleListDocument,
  ArticleListQuery,
  AuthorDocument,
  AuthorQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useMemo } from 'react';
import { z } from 'zod';

import { useQueryParams, useReplaceSearch } from '../router-hooks';

const take = 10;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  slug: z.string(),
});

const listVariables = (
  authorId: string | undefined,
  page: number | undefined
) => ({
  take,
  skip: ((page ?? 1) - 1) * take,
  filter: {
    authors: authorId ? [authorId] : [],
    excludeHideAuthor: true,
  },
});

/** TanStack port of `getAuthorStaticProps`. */
export const prefetchAuthor = async (
  client: ApolloClient,
  { slug }: { slug: string }
) => {
  const author = await client.query<AuthorQuery>({
    query: AuthorDocument,
    variables: { slug },
  });

  return {
    author,
    prefetchArticles: () =>
      client.query<ArticleListQuery>({
        query: ArticleListDocument,
        variables: listVariables(author.data?.author?.id, 1),
      }),
  };
};

/** TanStack port of `AuthorPage`. */
export function AuthorPage({ className }: { className?: string }) {
  const {
    Head,
    elements: { Pagination, H3 },
  } = useWebsiteBuilder();

  const replaceSearch = useReplaceSearch();
  const { page, slug } = pageSchema.parse(useQueryParams());

  const { data } = useQuery(AuthorDocument, {
    fetchPolicy: 'cache-only',
    variables: { slug },
  });

  const variables = useMemo(
    () => listVariables(data?.author?.id, page),
    [page, data?.author?.id]
  );

  const { data: articleListData } = useQuery(ArticleListDocument, {
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (
      articleListData?.articles.totalCount &&
      articleListData?.articles.totalCount > take
    ) {
      return Math.ceil(articleListData.articles.totalCount / take);
    }

    return 1;
  }, [articleListData?.articles.totalCount]);

  const canonicalUrl = `/author/${slug}`;

  return (
    <ArticleWrapper className={className}>
      <AuthorContainer slug={slug} />

      {data?.author && (
        <>
          {!!articleListData?.articles.nodes.length && (
            <H3 component={'h2'}>Alle Artikel von {data.author.name}</H3>
          )}
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
      )}
    </ArticleWrapper>
  );
}
