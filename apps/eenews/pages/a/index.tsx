import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  FullTeaserFragment,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleListQuery,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { z } from 'zod';

import { EenewsTeaserGrid } from '../../src/components/blocks/eenews-teaser-grid';
import { EenewsPageShell } from '../../src/components/eenews-page-shell';
import { EenewsPagination } from '../../src/components/eenews-pagination';

const take = 25;

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
});

export default function ArticleList() {
  const { query, replace } = useRouter();
  const { page } = pageSchema.parse(query);

  const variables = useMemo(
    () => ({
      take,
      skip: ((page ?? 1) - 1) * take,
    }),
    [page]
  );

  const { data, loading } = useArticleListQuery({
    fetchPolicy: 'cache-and-network',
    variables,
  });

  const teasers = useMemo(
    () =>
      (data?.articles.nodes ?? []).map(
        article =>
          ({
            __typename: 'ArticleTeaser',
            style: 'DEFAULT',
            image: null,
            preTitle: null,
            title: null,
            lead: null,
            article,
          }) as unknown as FullTeaserFragment
      ),
    [data?.articles.nodes]
  );

  const pageCount = useMemo(() => {
    if (data?.articles.totalCount && data?.articles.totalCount > take) {
      return Math.ceil(data.articles.totalCount / take);
    }

    return 1;
  }, [data?.articles.totalCount]);

  const canonicalUrl = '/a';

  return (
    <EenewsPageShell>
      <EenewsTeaserGrid
        teasers={teasers}
        numColumns={3}
        loading={loading}
        skeletonCount={take}
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

          <EenewsPagination
            page={page ?? 1}
            totalPages={pageCount}
            onChange={value =>
              replace({ query: { ...query, page: value } }, undefined, {
                shallow: true,
                scroll: true,
              })
            }
          />
        </>
      )}
    </EenewsPageShell>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
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

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
