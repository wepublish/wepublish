import {
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { AuthorContainer } from '@wepublish/author/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  ArticleListQuery,
  AuthorDocument,
  AuthorQuery,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SlimArticleFragment,
  useArticleListQuery,
  useAuthorQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

const take = 10;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  slug: z.string(),
});

export default function AuthorPage({
  className,
}: InferGetStaticPropsType<typeof getStaticProps> & {
  className?: string;
}) {
  const {
    elements: { Pagination, H3 },
  } = useWebsiteBuilder();

  const { query, replace, locale } = useRouter();
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

  const localeFilter = useCallback(
    (articles: SlimArticleFragment[]) =>
      articles.filter(article => article.slug?.endsWith(`-${locale}`)),
    [locale]
  );

  const { data: articleListData } = useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables,
  });

  const localizedArticles = useMemo(
    () => localeFilter(articleListData?.articles.nodes ?? []),
    [articleListData?.articles.nodes, localeFilter]
  );

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
      <AuthorContainer slug={slug as string} />

      {data?.author && (
        <>
          {!!localizedArticles.length && (
            <H3 component={'h2'}>Alle Artikel von {data.author.name}</H3>
          )}
          <ArticleListContainer
            variables={variables}
            filter={localeFilter}
          />

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
                  replace(
                    {
                      query: { ...query, page: value },
                    },
                    undefined,
                    { shallow: true, scroll: true }
                  )
                }
              />
            </>
          )}
        </>
      )}
    </ArticleWrapper>
  );
}

export const getStaticPaths = async () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const [author] = await Promise.all([
    client.query<AuthorQuery>({
      query: AuthorDocument,
      variables: {
        slug,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const is404 = author.errors?.find(
    ({ extensions }) => extensions?.status === 404
  );

  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  await client.query<ArticleListQuery>({
    query: ArticleListDocument,
    variables: {
      take,
      skip: 0,
      filter: {
        authors: author.data?.author?.id ? [author.data.author.id] : [],
      },
    },
  });

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60,
  };
};
