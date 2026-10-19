import { Inject } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import {
  HeaderMap,
  type ApolloServerPlugin,
  type GraphQLRequestListener,
} from '@apollo/server';
import { type FormattedExecutionResult } from 'graphql';
import type { Cache } from 'cache-manager';
import { NamespaceVersions, traceCacheGet } from '@wepublish/kv-ttl-cache/api';
import {
  type AnswerContext,
  answerKey,
  answerNamespaces,
  answerTtlSeconds,
  asksOnlyCacheableQueries,
  asksOnlySameForEveryoneQueries,
  isAnonymous,
  isPreview,
} from './graphql-response-cache.keys';
import {
  GRAPHQL_RESPONSES_CACHE,
  GRAPHQL_RESPONSES_PROFILE,
} from './public-content-namespaces';
import { answerTtlLimit, isAnswerCacheSkipped } from './skip-answer-cache';

@Plugin()
export class GraphqlResponseCachePlugin implements ApolloServerPlugin<AnswerContext> {
  constructor(
    @Inject(NamespaceVersions) private versions: NamespaceVersions,
    @Inject(GRAPHQL_RESPONSES_CACHE) private answers: Cache
  ) {}

  async requestDidStart(): Promise<GraphQLRequestListener<AnswerContext>> {
    const versions = this.versions;
    const answers = this.answers;
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

        const responseKey = answerKey(
          requestContext,
          await versions.currentMany(answerNamespaces(requestContext))
        );

        key = responseKey;

        const cached = await traceCacheGet(
          GRAPHQL_RESPONSES_PROFILE.name,
          async () => {
            const value =
              await answers.get<FormattedExecutionResult>(responseKey);

            return { value, hit: !!value };
          }
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

      async willSendResponse({ response, contextValue }) {
        if (
          !key ||
          !storeAnswer ||
          answeredFromCache ||
          isAnswerCacheSkipped(contextValue) ||
          response.body.kind !== 'single'
        ) {
          return;
        }

        const result = response.body.singleResult;

        if (result.errors?.length || !result.data) {
          return;
        }

        const ttl = answerTtlSeconds(result.data);

        await answers.set(
          key,
          result,
          Math.min(ttl, answerTtlLimit(contextValue) ?? ttl) * 1000
        );
      },
    };
  }
}
