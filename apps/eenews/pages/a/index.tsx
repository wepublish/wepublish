import {
  addClientCacheToV1Props,
  ArticleListDocument,
  ArticleSort,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { EenewsArchivePage } from '../../src/components/eenews-archive-page';

const take = 24;

const orderSchema = z.enum(['asc', 'desc']).optional().default('desc');
const pageSchema = z.coerce.number().gte(1).optional().default(1);
const takeSchema = z.coerce.number().gte(1).lte(120).optional().default(take);

export default function ArchiveRoute() {
  const { query, replace } = useRouter();
  const page = pageSchema.parse(query.page);
  const order = orderSchema.parse(query.order);
  const currentTake = takeSchema.parse(query.take);

  const articleSort = ArticleSort.PublishedAt;
  const articleOrder =
    order === 'asc' ? SortOrder.Ascending : SortOrder.Descending;

  return (
    <EenewsArchivePage
      variables={{
        take: currentTake,
        skip: (page - 1) * currentTake,
        sort: articleSort,
        order: articleOrder,
      }}
      onVariablesChange={variables => {
        const nextOrder =
          variables?.order === SortOrder.Ascending ? 'asc'
          : variables?.order === SortOrder.Descending ? 'desc'
          : order;
        const nextTake = variables?.take ?? currentTake;
        const nextSkip = variables?.skip ?? (page - 1) * currentTake;
        const nextPage = nextTake > 0 ? Math.floor(nextSkip / nextTake) + 1 : 1;

        replace(
          {
            query: {
              ...query,
              page: nextPage,
              order: nextOrder,
              take: nextTake,
            },
          },
          undefined,
          { shallow: true, scroll: false }
        );
      }}
    />
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);

  // Pre-warm both sort orders so the first sort-toggle is a cache hit
  // (no scroll-jump on first switch — same trick as the topic page).
  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
      },
    }),
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Ascending,
      },
    }),
    // The earliest-article sidecar query the archive page reads for the
    // "Erster Beitrag" stat — small (take: 1) but warming it removes a
    // round trip on first paint.
    client.query({
      query: ArticleListDocument,
      variables: {
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Ascending,
        take: 1,
      },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const props = addClientCacheToV1Props(client, {});

  return { props, revalidate: 60 };
};
