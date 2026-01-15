import styled from '@emotion/styled';
import {
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { AuthorContainer } from '@wepublish/author/website';
import { pageSchema, take } from '@wepublish/utils/website';
import { useArticleListQuery, useAuthorQuery } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export const ArticleListHeader = styled('h2')`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-top-left-radius: 0.8rem;
  border-top-right-radius: 0.8rem;
  padding: 0.33rem 1rem;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  grid-column: -1 / 1;
`;

export default function AuthorPage() {
  const {
    elements: { Pagination, H3 },
  } = useWebsiteBuilder();

  const { query, replace } = useRouter();
  const { page, slug } = pageSchema.parse(query);

  const { data } = useAuthorQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug,
    },
  });

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take,
      filter: {
        authors: data?.author?.id ? [data?.author?.id] : [],
      },
    }),
    [page, data?.author?.id]
  );

  const { data: articleListData } = useArticleListQuery({
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

  return (
    <ArticleWrapper>
      <AuthorContainer slug={slug as string} />

      {data?.author && (
        <>
          {!!articleListData?.articles.nodes.length && (
            <H3 component={ArticleListHeader}>
              Artikel von {data.author.name}
            </H3>
          )}
          <ArticleListContainer variables={variables} />

          {pageCount > 1 && (
            <Pagination
              page={page ?? 1}
              count={pageCount}
              onChange={(_, value) =>
                replace(
                  {
                    query: { ...query, page: value },
                  },
                  undefined,
                  { shallow: true, scroll: true }
                )
              }
            />
          )}
        </>
      )}
    </ArticleWrapper>
  );
}

export {
  getAuthorStaticPaths as getStaticPaths,
  getAuthorStaticProps as getStaticProps,
} from '@wepublish/utils/website';
