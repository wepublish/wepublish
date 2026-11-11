import { type GraphQLRequestContext } from '@apollo/server';
import { Kind, type SelectionSetNode } from 'graphql';
import { createHash } from 'crypto';
import {
  PAGE_CONTENT_NAMESPACES,
  PUBLIC_COMMENTS_NAMESPACE,
  contentCacheNamespace,
} from './public-content-namespaces';

const RESPONSE_TTL_SECONDS = 300;
const LIVE_RESPONSE_TTL_SECONDS = 30;
const LIVE_BLOCKS = new Set(['PollBlock', 'CrowdfundingBlock']);
const LIVE_FIELDS = ['poll', 'crowdfunding'];

const hasLiveBlock = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(hasLiveBlock);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const node = value as { __typename?: unknown; disabled?: unknown };

  if (node.disabled === true) {
    return false;
  }

  if (typeof node.__typename === 'string' && LIVE_BLOCKS.has(node.__typename)) {
    return true;
  }

  if (
    LIVE_FIELDS.some(
      field =>
        typeof (node as Record<string, unknown>)[field] === 'object' &&
        (node as Record<string, unknown>)[field] !== null
    )
  ) {
    return true;
  }

  return Object.values(value).some(hasLiveBlock);
};

export const answerTtlSeconds = (data: unknown) =>
  hasLiveBlock(data) ? LIVE_RESPONSE_TTL_SECONDS : RESPONSE_TTL_SECONDS;

const VERSIONED_BY = PAGE_CONTENT_NAMESPACES;

export const CACHEABLE_QUERIES = new Set([
  '__typename',
  'article',
  'articles',
  'author',
  'authors',
  'commentsForItem',
  'event',
  'events',
  'getImagesByTag',
  'hotAndTrending',
  'memberPlans',
  'navigations',
  'newSubscribers',
  'page',
  'pages',
  'peer',
  'peerProfile',
  'primaryBanner',
  'ratingSystem',
  'revenue',
  'setting',
  'settings',
  'stats',
  'tag',
  'tags',
  'websiteSettings',
]);

export const SAME_FOR_EVERYONE_QUERIES = new Set([
  '__typename',
  'navigations',
  'peerProfile',
]);

const VERSIONED_BY_FIELD: Record<string, string[]> = {
  commentsForItem: [PUBLIC_COMMENTS_NAMESPACE],
  ratingSystem: [PUBLIC_COMMENTS_NAMESPACE],
  getImagesByTag: [contentCacheNamespace('images')],
};

const DRAFT_FIELDS = new Set(['draft', 'pending']);
const VERSIONED_BY_DRAFTS = [
  contentCacheNamespace('articles'),
  contentCacheNamespace('pages'),
];

export type AnswerContext = {
  req?: { query?: Record<string, unknown>; body?: Record<string, unknown> };
};

type RequestContext = GraphQLRequestContext<AnswerContext>;

const selectsDrafts = ({ operation, document }: RequestContext) => {
  const fragments = new Map<string, SelectionSetNode>();

  for (const definition of document?.definitions ?? []) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments.set(definition.name.value, definition.selectionSet);
    }
  }

  const visited = new Set<string>();
  const selects = (selectionSet: SelectionSetNode | undefined): boolean =>
    (selectionSet?.selections ?? []).some(selection => {
      if (selection.kind === Kind.FIELD) {
        return (
          DRAFT_FIELDS.has(selection.name.value) ||
          selects(selection.selectionSet)
        );
      }

      if (selection.kind === Kind.INLINE_FRAGMENT) {
        return selects(selection.selectionSet);
      }

      const name = selection.name.value;

      if (visited.has(name)) {
        return false;
      }

      visited.add(name);

      return selects(fragments.get(name));
    });

  return selects(operation?.selectionSet);
};

export const isPreview = ({ request }: RequestContext) =>
  !!request.http?.headers?.get('preview');

export const isAnonymous = ({ request, contextValue }: RequestContext) => {
  const search = new URLSearchParams(request.http?.search ?? '');

  return (
    !request.http?.headers?.get('authorization') &&
    !search.has('access_token') &&
    contextValue.req?.query?.['access_token'] === undefined &&
    contextValue.req?.body?.['access_token'] === undefined
  );
};

const sortedKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortedKeys);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, sortedKeys((value as Record<string, unknown>)[key])])
  );
};

const declaredVariables = ({ operation, request }: RequestContext) =>
  sortedKeys(
    Object.fromEntries(
      (operation?.variableDefinitions ?? [])
        .map(definition => definition.variable.name.value)
        .filter(name => request.variables?.[name] !== undefined)
        .map(name => [name, request.variables?.[name]])
    )
  );

const asksOnly =
  (queries: Set<string>) =>
  ({ operation }: RequestContext) =>
    operation?.operation === 'query' &&
    operation.selectionSet.selections.every(
      selection =>
        selection.kind === 'Field' && queries.has(selection.name.value)
    );

export const asksOnlyCacheableQueries = asksOnly(CACHEABLE_QUERIES);
export const asksOnlySameForEveryoneQueries = asksOnly(
  SAME_FOR_EVERYONE_QUERIES
);

export const answerNamespaces = (requestContext: RequestContext) => {
  const namespaces = new Set(VERSIONED_BY);

  for (const selection of requestContext.operation?.selectionSet.selections ??
    []) {
    if (selection.kind === 'Field') {
      for (const namespace of VERSIONED_BY_FIELD[selection.name.value] ?? []) {
        namespaces.add(namespace);
      }
    }
  }

  if (selectsDrafts(requestContext)) {
    for (const namespace of VERSIONED_BY_DRAFTS) {
      namespaces.add(namespace);
    }
  }

  return [...namespaces];
};

export const answerKey = (
  requestContext: RequestContext,
  versions: readonly string[]
) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        requestContext.source,
        requestContext.request.operationName ?? null,
        declaredVariables(requestContext),
        versions,
      ])
    )
    .digest('hex');
