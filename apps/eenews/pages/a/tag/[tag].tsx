import { TagContainer } from '@wepublish/tag/website';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  ArticleSort,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  TagDocument,
  TagType,
} from '@wepublish/website/api';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { z } from 'zod';

const take = 24;

const orderSchema = z.enum(['asc', 'desc']).optional().default('desc');
const pageSchema = z.coerce.number().gte(1).optional().default(1);
const takeSchema = z.coerce.number().gte(1).lte(120).optional().default(take);

export default function TagRoute({
  tag,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { query, replace } = useRouter();
  const page = pageSchema.parse(query.page);
  const order = orderSchema.parse(query.order);
  const currentTake = takeSchema.parse(query.take);

  const articleSort = ArticleSort.PublishedAt;
  const articleOrder =
    order === 'asc' ? SortOrder.Ascending : SortOrder.Descending;

  return (
    <TagContainer
      tag={tag}
      type={TagType.Article}
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
          // shallow: don't re-run getStaticProps; scroll: false: keep the
          // user's scroll position when they change sort or hit "load more".
          { shallow: true, scroll: false }
        );
      }}
    />
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps = (async ({ params }) => {
  const { tag } = params || {};

  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);

  const tagResult = await client.query({
    query: TagDocument,
    variables: { tag, type: TagType.Article },
  });

  // Optional chaining on `data` — when the API returns a partial response
  // (errors mid-fetch, network blip, schema mismatch) `data` itself can be
  // null and accessing `.tag` directly throws "Cannot read properties of
  // null (reading 'tag')". Hit on /a/tag/klima before `klima` was seeded.
  if (tagResult.error || !tagResult.data?.tag) {
    return { notFound: true, revalidate: 1 };
  }

  const tagId = tagResult.data.tag.id;

  // Pre-warm the Apollo cache with BOTH sort orders so the first client-side
  // switch (Neueste ↔ Älteste) is a cache hit instead of a fresh round-trip.
  // Without this, the first toggle empties the article grid for ~150ms, the
  // page height shifts, and the browser loses the user's scroll anchor —
  // resulting in a visible "jump to top". Pre-warming costs one extra
  // request per topic at build/revalidate time and keeps the cache
  // double-sized, both acceptable trade-offs for the UX.
  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        filter: { tags: [tagId] },
      },
    }),
    client.query({
      query: ArticleListDocument,
      variables: {
        take,
        skip: 0,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Ascending,
        filter: { tags: [tagId] },
      },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  const props = addClientCacheToV1Props(client, {
    tag: tag as string,
  });

  return { props, revalidate: 60 };
}) satisfies GetStaticProps;
