import { Inject, Injectable } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import {
  HeaderMap,
  type ApolloServerPlugin,
  type GraphQLRequestContext,
  type GraphQLRequestListener,
} from '@apollo/server';
import type { FormattedExecutionResult } from 'graphql';
import { createHash } from 'crypto';
import { KvTtlCacheService } from './kv-ttl-cache.service';

export const PUBLIC_CONTENT_NAMESPACE = 'graphql:content';
export const PUBLIC_COMMENTS_NAMESPACE = 'graphql:comments';

export type PublicContent =
  | 'articles'
  | 'pages'
  | 'authors'
  | 'images'
  | 'paywalls';

export const contentCacheNamespace = (content: PublicContent) =>
  `content:${content}`;

export const CONTENT_CACHE_TTL_SECONDS = 300;

const REPLICAS_CAUGHT_UP_MS = 3000;

const RESPONSE_NAMESPACE = 'graphql:responses';
const RESPONSE_TTL_SECONDS = 300;

const VERSIONED_BY = [
  PUBLIC_CONTENT_NAMESPACE,
  'navigations',
  'banners',
  'settings',
  'website-settings',
  'peer-profile',
  'member-plans',
  'peering:remote-profiles',
];

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
  'versionInformation',
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
};

type Context = {
  req?: { query?: Record<string, unknown>; body?: Record<string, unknown> };
};

type RequestContext = GraphQLRequestContext<Context>;

const isPreview = ({ request }: RequestContext) =>
  !!request.http?.headers?.get('preview');

const isAnonymous = ({ request, contextValue }: RequestContext) => {
  const search = new URLSearchParams(request.http?.search ?? '');

  return (
    !request.http?.headers?.get('authorization') &&
    !search.has('access_token') &&
    contextValue.req?.query?.['access_token'] === undefined &&
    contextValue.req?.body?.['access_token'] === undefined
  );
};

const asksOnly =
  (queries: Set<string>) =>
  ({ operation }: RequestContext) =>
    operation?.operation === 'query' &&
    operation.selectionSet.selections.every(
      selection =>
        selection.kind === 'Field' && queries.has(selection.name.value)
    );

const asksOnlyCacheableQueries = asksOnly(CACHEABLE_QUERIES);
const asksOnlySameForEveryoneQueries = asksOnly(SAME_FOR_EVERYONE_QUERIES);

@Injectable()
export class PublicContentCacheInvalidator {
  constructor(@Inject(KvTtlCacheService) private kv: KvTtlCacheService) {}

  async invalidate(...contents: PublicContent[]) {
    await this.invalidateDraft(...contents);
    await this.kv.resetNamespace(PUBLIC_CONTENT_NAMESPACE);

    setTimeout(() => {
      this.kv.resetNamespace(PUBLIC_CONTENT_NAMESPACE).catch(() => undefined);
    }, REPLICAS_CAUGHT_UP_MS).unref?.();
  }

  async invalidateDraft(...contents: PublicContent[]) {
    await Promise.all(
      contents.map(content =>
        this.kv.resetNamespace(contentCacheNamespace(content))
      )
    );
  }

  invalidateComments() {
    return this.kv.resetNamespace(PUBLIC_COMMENTS_NAMESPACE);
  }
}

@Plugin()
export class GraphqlResponseCachePlugin implements ApolloServerPlugin<Context> {
  constructor(@Inject(KvTtlCacheService) private kv: KvTtlCacheService) {}

  async requestDidStart(): Promise<GraphQLRequestListener<Context>> {
    const kv = this.kv;
    let key: string | undefined;
    let storeAnswer = false;
    let answeredFromCache = false;

    return {
      async responseForOperation(requestContext) {
        if (isPreview(requestContext)) {
          return null;
        }

        const anonymous = isAnonymous(requestContext);
        const readable =
          anonymous ?
            asksOnlyCacheableQueries(requestContext)
          : asksOnlySameForEveryoneQueries(requestContext);

        if (!readable) {
          return null;
        }

        storeAnswer = anonymous;

        const namespaces = new Set(VERSIONED_BY);

        for (const selection of requestContext.operation?.selectionSet
          .selections ?? []) {
          if (selection.kind === 'Field') {
            for (const namespace of VERSIONED_BY_FIELD[selection.name.value] ??
              []) {
              namespaces.add(namespace);
            }
          }
        }

        const versions = await Promise.all(
          [...namespaces].map(namespace => kv.getNamespaceVersion(namespace))
        );

        key = createHash('sha256')
          .update(
            JSON.stringify([
              requestContext.source,
              requestContext.request.operationName ?? null,
              requestContext.request.variables ?? {},
              versions,
            ])
          )
          .digest('hex');

        const cached = await kv.getNs<FormattedExecutionResult>(
          RESPONSE_NAMESPACE,
          key
        );

        if (!cached) {
          return null;
        }

        answeredFromCache = true;

        return {
          http: { status: undefined, headers: new HeaderMap() },
          body: { kind: 'single', singleResult: cached },
        };
      },

      async willSendResponse({ response }) {
        if (
          !key ||
          !storeAnswer ||
          answeredFromCache ||
          response.body.kind !== 'single'
        ) {
          return;
        }

        const result = response.body.singleResult;

        if (result.errors?.length || !result.data) {
          return;
        }

        await kv.setNs(RESPONSE_NAMESPACE, key, result, RESPONSE_TTL_SECONDS);
      },
    };
  }
}
