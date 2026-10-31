import { ApolloClient } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import {
  ArticleListDocument,
  ArticleListQuery,
  ArticleSort,
  AuthorDocument,
  AuthorListDocument,
  AuthorSort,
  EventDocument,
  EventListDocument,
  EventSort,
  FullAuthorFragment,
  FullEventFragment,
  FullMemberPlanFragment,
  FullPaywallFragment,
  MemberPlanDocument,
  MemberPlanListDocument,
  MemberPlanSort,
  PageDocument,
  PageListDocument,
  PageSort,
  PageWithoutBlocksFragment,
  PaywallListDocument,
  SortOrder,
} from '@wepublish/editor/api';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  matchesRecordQuery,
  RecordId,
  RecordModel,
  RecordOption,
  recordStatusOf,
} from './record.field';

export type { RecordOption } from './record.field';

export type RecordSearchOptions = {
  skip?: boolean;
};

export type RecordSearchResult = {
  options: RecordOption[];
  loading: boolean;
  error?: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

export type RecordLookupResult = {
  records: Partial<Record<RecordId, RecordOption>>;
  loading: boolean;
};

export type RecordSource = {
  model: RecordModel;
  useSearch: (
    query: string,
    options?: RecordSearchOptions
  ) => RecordSearchResult;
  useRecords: (ids: RecordId[]) => RecordLookupResult;
};

export type RecordSources = { [Model in RecordModel]: RecordSource };

export const recordSearchTake = 20;

const maxTake = 100;

type ImageUrls = {
  squareURL: string | null;
  thumbURL: string | null;
  previewURL: string | null;
  url: string;
} | null;

type Connection<Node> = {
  nodes: Node[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
};

type ArticleNode = ArticleListQuery['articles']['nodes'][number];

type RecordLookup = (
  client: ApolloClient,
  id: RecordId
) => Promise<RecordOption | null | undefined>;

const eventDateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

const imageUrlOf = (image: ImageUrls) =>
  image?.squareURL ?? image?.thumbURL ?? image?.previewURL ?? image?.url;

const joinParts = (...parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(' · ') || undefined;

const byId = (options: RecordOption[]) =>
  Object.fromEntries(options.map(option => [option.id, option]));

const articleToOption = (article: ArticleNode): RecordOption => ({
  id: article.id,
  title: article.latest.title ?? '',
  subtitle: joinParts(
    article.latest.preTitle,
    article.latest.authors.map(({ author }) => author.name).join(', ')
  ),
  imageUrl: imageUrlOf(article.latest.image),
  status: recordStatusOf(article),
});

const pageToOption = (page: PageWithoutBlocksFragment): RecordOption => ({
  id: page.id,
  title: page.latest.title ?? '',
  subtitle: page.slug ? `/${page.slug}` : undefined,
  imageUrl: imageUrlOf(page.latest.image),
  status: recordStatusOf(page),
});

const eventToOption = (event: FullEventFragment): RecordOption => ({
  id: event.id,
  title: event.name,
  subtitle: joinParts(
    eventDateFormat.format(new Date(event.startsAt)),
    event.location
  ),
  imageUrl: imageUrlOf(event.image),
});

const memberPlanToOption = (plan: FullMemberPlanFragment): RecordOption => ({
  id: plan.id,
  title: plan.name,
  subtitle: plan.slug,
  imageUrl: imageUrlOf(plan.image),
});

const authorToOption = (author: FullAuthorFragment): RecordOption => ({
  id: author.id,
  title: author.name,
  subtitle: author.jobTitle ?? undefined,
  imageUrl: imageUrlOf(author.image),
});

const paywallToOption = (paywall: FullPaywallFragment): RecordOption => ({
  id: paywall.id,
  title: paywall.name ?? '',
  subtitle: joinParts(...paywall.memberPlans.map(plan => plan.name)),
});

const useSearchResult = <Node>({
  connection,
  loading,
  error,
  toOption,
  fetchNext,
}: {
  connection: Connection<Node> | undefined;
  loading: boolean;
  error: unknown;
  toOption: (node: Node) => RecordOption;
  fetchNext: (cursor: string) => Promise<unknown>;
}): RecordSearchResult => {
  const pendingCursor = useRef<string | null>(null);
  const endCursor = connection?.pageInfo.endCursor ?? null;
  const hasMore = !!connection?.pageInfo.hasNextPage && endCursor !== null;

  return {
    options: connection?.nodes.map(toOption) ?? [],
    loading,
    error: !!error,
    hasMore,
    loadMore: () => {
      if (!hasMore || !endCursor || pendingCursor.current === endCursor) {
        return;
      }

      pendingCursor.current = endCursor;
      fetchNext(endCursor)
        .catch(() => undefined)
        .finally(() => {
          pendingCursor.current = null;
        });
    },
  };
};

const staticSearchResult = (
  options: RecordOption[],
  loading: boolean,
  error: unknown
): RecordSearchResult => ({
  options,
  loading,
  error: !!error,
  hasMore: false,
  loadMore: () => undefined,
});

const useRecordLookup = (
  ids: RecordId[],
  lookup: RecordLookup
): RecordLookupResult => {
  const client = useApolloClient();
  const key = [...ids].sort().join('\n');
  const [resolved, setResolved] = useState<{
    key: string;
    records: Partial<Record<RecordId, RecordOption>>;
  }>({ key: '', records: {} });

  useEffect(() => {
    if (!key) {
      return;
    }

    let active = true;

    Promise.all(
      key.split('\n').map(id => lookup(client, id).catch(() => undefined))
    ).then(records => {
      if (active) {
        setResolved({
          key,
          records: byId(
            records.filter((record): record is RecordOption => !!record)
          ),
        });
      }
    });

    return () => {
      active = false;
    };
  }, [client, key, lookup]);

  return {
    records: resolved.records,
    loading: key !== '' && resolved.key !== key,
  };
};

const useArticleSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const title = query.trim();
  const { data, previousData, loading, error, fetchMore } = useQuery(
    ArticleListDocument,
    {
      variables: {
        filter:
          title ? { title, includeHidden: true } : { includeHidden: true },
        take: recordSearchTake,
        sort: ArticleSort.ModifiedAt,
        order: SortOrder.Descending,
      },
      skip,
    }
  );

  return useSearchResult({
    connection: (data ?? (loading ? previousData : undefined))?.articles,
    loading,
    error,
    toOption: articleToOption,
    fetchNext: cursor =>
      fetchMore({
        variables: { cursor, skip: 1 },
        updateQuery: (previous, { fetchMoreResult }) => ({
          ...fetchMoreResult,
          articles: {
            ...fetchMoreResult.articles,
            nodes: [
              ...previous.articles.nodes,
              ...fetchMoreResult.articles.nodes,
            ],
          },
        }),
      }),
  });
};

const useArticleRecords = (ids: RecordId[]): RecordLookupResult => {
  const sortedIds = [...ids].sort();
  const { data, previousData, loading } = useQuery(ArticleListDocument, {
    variables: {
      filter: { ids: sortedIds, includeHidden: true },
      take: Math.min(sortedIds.length, maxTake),
    },
    skip: !sortedIds.length,
  });

  return {
    records: byId(
      ((data ?? previousData)?.articles.nodes ?? []).map(articleToOption)
    ),
    loading,
  };
};

const usePageSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const title = query.trim();
  const { data, previousData, loading, error, fetchMore } = useQuery(
    PageListDocument,
    {
      variables: {
        filter:
          title ? { title, includeHidden: true } : { includeHidden: true },
        take: recordSearchTake,
        sort: PageSort.ModifiedAt,
        order: SortOrder.Descending,
      },
      skip,
    }
  );

  return useSearchResult({
    connection: (data ?? (loading ? previousData : undefined))?.pages,
    loading,
    error,
    toOption: pageToOption,
    fetchNext: cursor =>
      fetchMore({
        variables: { cursor, skip: 1 },
        updateQuery: (previous, { fetchMoreResult }) => ({
          ...fetchMoreResult,
          pages: {
            ...fetchMoreResult.pages,
            nodes: [...previous.pages.nodes, ...fetchMoreResult.pages.nodes],
          },
        }),
      }),
  });
};

const lookupPage: RecordLookup = async (client, id) => {
  const { data } = await client.query({
    query: PageDocument,
    variables: { id },
  });

  return data?.page && pageToOption(data.page);
};

const useEventSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const name = query.trim();
  const { data, previousData, loading, error, fetchMore } = useQuery(
    EventListDocument,
    {
      variables: {
        ...(name ? { filter: { name } } : {}),
        take: recordSearchTake,
        sort: EventSort.StartsAt,
        order: SortOrder.Descending,
      },
      skip,
    }
  );

  return useSearchResult({
    connection: (data ?? (loading ? previousData : undefined))?.events,
    loading,
    error,
    toOption: eventToOption,
    fetchNext: cursorId =>
      fetchMore({
        variables: { cursorId, skip: 1 },
        updateQuery: (previous, { fetchMoreResult }) => ({
          ...fetchMoreResult,
          events: {
            ...fetchMoreResult.events,
            nodes: [...previous.events.nodes, ...fetchMoreResult.events.nodes],
          },
        }),
      }),
  });
};

const lookupEvent: RecordLookup = async (client, id) => {
  const { data } = await client.query({
    query: EventDocument,
    variables: { id },
  });

  return data?.event && eventToOption(data.event);
};

const useAuthorSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const name = query.trim();
  const { data, previousData, loading, error, fetchMore } = useQuery(
    AuthorListDocument,
    {
      variables: {
        ...(name ? { filter: name } : {}),
        take: recordSearchTake,
        sort: AuthorSort.Name,
        order: SortOrder.Ascending,
      },
      skip,
    }
  );

  return useSearchResult({
    connection: (data ?? (loading ? previousData : undefined))?.authors,
    loading,
    error,
    toOption: authorToOption,
    fetchNext: cursorId =>
      fetchMore({
        variables: { cursorId, skip: 1 },
        updateQuery: (previous, { fetchMoreResult }) => ({
          ...fetchMoreResult,
          authors: {
            ...fetchMoreResult.authors,
            nodes: [
              ...previous.authors.nodes,
              ...fetchMoreResult.authors.nodes,
            ],
          },
        }),
      }),
  });
};

const lookupAuthor: RecordLookup = async (client, id) => {
  const { data } = await client.query({
    query: AuthorDocument,
    variables: { id },
  });

  return data?.author && authorToOption(data.author);
};

const useMemberPlanSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const { data, loading, error } = useQuery(MemberPlanListDocument, {
    variables: {
      take: maxTake,
      sort: MemberPlanSort.CreatedAt,
      order: SortOrder.Ascending,
    },
    skip,
  });

  return staticSearchResult(
    (data?.memberPlans.nodes ?? [])
      .filter(
        plan =>
          matchesRecordQuery(plan.name, query) ||
          matchesRecordQuery(plan.slug, query)
      )
      .map(memberPlanToOption),
    loading,
    error
  );
};

const lookupMemberPlan: RecordLookup = async (client, id) => {
  const { data } = await client.query({
    query: MemberPlanDocument,
    variables: { id },
  });

  return data?.memberPlan && memberPlanToOption(data.memberPlan);
};

const usePaywallSearch = (
  query: string,
  { skip = false }: RecordSearchOptions = {}
) => {
  const { data, loading, error } = useQuery(PaywallListDocument, { skip });

  return staticSearchResult(
    (data?.paywalls ?? [])
      .filter(paywall => matchesRecordQuery(paywall.name, query))
      .map(paywallToOption),
    loading,
    error
  );
};

const usePaywallRecords = (ids: RecordId[]): RecordLookupResult => {
  const { data, loading } = useQuery(PaywallListDocument, {
    skip: !ids.length,
  });

  return {
    records: byId(
      (data?.paywalls ?? [])
        .filter(paywall => ids.includes(paywall.id))
        .map(paywallToOption)
    ),
    loading,
  };
};

const usePageRecords = (ids: RecordId[]) => useRecordLookup(ids, lookupPage);

const useEventRecords = (ids: RecordId[]) => useRecordLookup(ids, lookupEvent);

const useAuthorRecords = (ids: RecordId[]) =>
  useRecordLookup(ids, lookupAuthor);

const useMemberPlanRecords = (ids: RecordId[]) =>
  useRecordLookup(ids, lookupMemberPlan);

export const recordSources: RecordSources = {
  article: {
    model: 'article',
    useSearch: useArticleSearch,
    useRecords: useArticleRecords,
  },
  page: {
    model: 'page',
    useSearch: usePageSearch,
    useRecords: usePageRecords,
  },
  event: {
    model: 'event',
    useSearch: useEventSearch,
    useRecords: useEventRecords,
  },
  memberPlan: {
    model: 'memberPlan',
    useSearch: useMemberPlanSearch,
    useRecords: useMemberPlanRecords,
  },
  author: {
    model: 'author',
    useSearch: useAuthorSearch,
    useRecords: useAuthorRecords,
  },
  paywall: {
    model: 'paywall',
    useSearch: usePaywallSearch,
    useRecords: usePaywallRecords,
  },
};

export const RecordSourcesContext = createContext<RecordSources>(recordSources);

export const useRecordSource = (model: RecordModel) =>
  useContext(RecordSourcesContext)[model];
