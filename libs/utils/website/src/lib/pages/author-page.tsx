import {
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { AuthorContainer } from '@wepublish/author/website';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  ArticleListQuery,
  AuthorDocument,
  AuthorQuery,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleListQuery,
  useAuthorQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

const take = 10;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  slug: z.string(),
});

export function AuthorPage({
  className,
}: InferGetStaticPropsType<typeof getAuthorStaticProps> & {
  className?: string;
}) {
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

  const canonicalUrl = `/author/${slug}`;

  return (
    <ArticleWrapper className={className}>
      <AuthorContainer slug={slug as string} />

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

export const getAuthorStaticPaths = async () => ({
  paths: [],
  fallback: 'blocking',
});

export const getAuthorStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params || {};

  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);

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

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
