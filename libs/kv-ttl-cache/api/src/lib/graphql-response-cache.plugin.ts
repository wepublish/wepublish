import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
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
import { PublicationTimers } from './publication-timers';
import { traceCacheGet } from './kv-ttl-cache-tracing';
import {
  PAGE_CONTENT_NAMESPACES,
  PUBLIC_CONTENT_NAMESPACE,
  articlePagePaths,
} from './kv-ttl-cache-shared-namespaces';

export { PUBLIC_CONTENT_NAMESPACE };
export const PUBLIC_COMMENTS_NAMESPACE = 'graphql:comments';

export type ArticlePage = { id: string; slug?: string | null };

export type PublicContent =
  | 'articles'
  | 'pages'
  | 'authors'
  | 'images'
  | 'paywalls'
  | 'polls';

export const contentCacheNamespace = (content: PublicContent) =>
  `content:${content}`;

export const CONTENT_CACHE_TTL_SECONDS = 300;

const REPLICAS_CAUGHT_UP_MS = 3000;
const LONGEST_SCHEDULE_MS = 24 * 60 * 60 * 1000;
const NAVIGATIONS_NAMESPACE = 'navigations';

const RESPONSE_NAMESPACE = 'graphql:responses';
const RESPONSE_TTL_SECONDS = 300;
const LIVE_RESPONSE_TTL_SECONDS = 30;
const LIVE_BLOCKS = new Set(['PollBlock', 'CrowdfundingBlock']);

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

  return Object.values(value).some(hasLiveBlock);
};

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
export class PublicContentCacheInvalidator implements OnModuleDestroy {
  private timers = new Map<string, PublicationTimers>();

  constructor(@Inject(KvTtlCacheService) private kv: KvTtlCacheService) {}

  onModuleDestroy() {
    for (const timers of this.timers.values()) {
      timers.clear();
    }
  }

  invalidateAt(at: Date, ...contents: PublicContent[]) {
    const wait = at.getTime() - Date.now();

    if (wait <= 0 || wait > LONGEST_SCHEDULE_MS) {
      return;
    }

    const key = [...contents].sort().join(',');
    const timers = this.timers.get(key) ?? new PublicationTimers();
    this.timers.set(key, timers);
    timers.schedule([at], () => this.invalidate(...contents));
  }

  invalidateNavigations() {
    return this.kv.resetNamespace(NAVIGATIONS_NAMESPACE);
  }

  async invalidate(...contents: PublicContent[]) {
    await this.invalidateDraft(...contents);
    await this.resetPublicContent();
  }

  private async resetPublicContent(options?: { pages?: boolean }) {
    await this.kv.resetNamespace(PUBLIC_CONTENT_NAMESPACE, options);

    setTimeout(() => {
      this.kv
        .resetNamespace(PUBLIC_CONTENT_NAMESPACE, options)
        .catch(() => undefined);
    }, REPLICAS_CAUGHT_UP_MS).unref?.();
  }

  async invalidateDraft(...contents: PublicContent[]) {
    await Promise.all(
      contents.map(content =>
        this.kv.resetNamespace(contentCacheNamespace(content))
      )
    );
  }

  async invalidateArticlePages(...articles: ArticlePage[]) {
    await this.kv.resetWebsitePaths([
      ...new Set(articles.flatMap(articlePagePaths)),
    ]);
  }

  async invalidateComments(removed = false, ...articles: ArticlePage[]) {
    await this.kv.resetNamespace(PUBLIC_COMMENTS_NAMESPACE);

    if (removed) {
      await this.invalidate();
    }

    if (articles.length) {
      await this.invalidateArticlePages(...articles);
    }
  }

  async invalidateReaderComments(removed = false) {
    await this.kv.resetNamespace(PUBLIC_COMMENTS_NAMESPACE);

    if (removed) {
      await this.resetPublicContent({ pages: false });
    }
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
        const anonymous = isAnonymous(requestContext);

        if (!anonymous && isPreview(requestContext)) {
          return null;
        }

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

        const responseKey = createHash('sha256')
          .update(
            JSON.stringify([
              requestContext.source,
              requestContext.request.operationName ?? null,
              requestContext.request.variables ?? {},
              versions,
            ])
          )
          .digest('hex');

        key = responseKey;

        const cached = await traceCacheGet(RESPONSE_NAMESPACE, async () => {
          const value = await kv.getNs<FormattedExecutionResult>(
            RESPONSE_NAMESPACE,
            responseKey
          );

          return { value, hit: !!value };
        });

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

        await kv.setNs(
          RESPONSE_NAMESPACE,
          key,
          result,
          hasLiveBlock(result.data) ?
            LIVE_RESPONSE_TTL_SECONDS
          : RESPONSE_TTL_SECONDS
        );
      },
    };
  }
}
