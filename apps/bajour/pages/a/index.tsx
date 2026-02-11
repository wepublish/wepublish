import { ArticleListContainer } from '@wepublish/article/website';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

import { Container } from '../../src/components/layout/container';
import Head from 'next/head';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

export default function ArticleList() {
  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take,
    }),
    [page]
  );

  const { data } = useArticleListQuery({
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > take) {
      return Math.ceil(data.articles.totalCount / take);
    }

    return 1;
  }, [data?.articles.totalCount]);

  const canonicalUrl = '/a';

  return (
    <Container>
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
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  await Promise.all([
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
      },
    }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
