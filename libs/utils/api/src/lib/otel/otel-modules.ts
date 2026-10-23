import type { Instrumentation } from '@opentelemetry/instrumentation';
import type { NodeSDK } from '@opentelemetry/sdk-node';
import type { resourceFromAttributes } from '@opentelemetry/resources';

export type OtelModules = {
  NodeSDK: typeof NodeSDK;
  resourceFromAttributes: typeof resourceFromAttributes;
  instrumentationFactories: Record<string, () => Instrumentation>;
};

export function loadOtelModules(): OtelModules {
  const { NodeSDK } =
    require('@opentelemetry/sdk-node') as typeof import('@opentelemetry/sdk-node');
  const { resourceFromAttributes } =
    require('@opentelemetry/resources') as typeof import('@opentelemetry/resources');

  return {
    NodeSDK,
    resourceFromAttributes,
    instrumentationFactories: {
      '@opentelemetry/instrumentation-http': () => {
        const { HttpInstrumentation } =
          require('@opentelemetry/instrumentation-http') as typeof import('@opentelemetry/instrumentation-http');

        return new HttpInstrumentation({
          ignoreIncomingRequestHook: request =>
            request.url?.startsWith('/health') ?? false,
        });
      },
      '@opentelemetry/instrumentation-express': () => {
        const { ExpressInstrumentation } =
          require('@opentelemetry/instrumentation-express') as typeof import('@opentelemetry/instrumentation-express');

        return new ExpressInstrumentation();
      },
      '@opentelemetry/instrumentation-nestjs-core': () => {
        const { NestInstrumentation } =
          require('@opentelemetry/instrumentation-nestjs-core') as typeof import('@opentelemetry/instrumentation-nestjs-core');

        return new NestInstrumentation();
      },
      '@opentelemetry/instrumentation-graphql': () => {
        const { GraphQLInstrumentation } =
          require('@opentelemetry/instrumentation-graphql') as typeof import('@opentelemetry/instrumentation-graphql');

        return new GraphQLInstrumentation({
          mergeItems: true,
          ignoreTrivialResolveSpans: true,
        });
      },
      '@opentelemetry/instrumentation-pg': () => {
        const { PgInstrumentation } =
          require('@opentelemetry/instrumentation-pg') as typeof import('@opentelemetry/instrumentation-pg');

        return new PgInstrumentation({ requireParentSpan: true });
      },
      '@opentelemetry/instrumentation-undici': () => {
        const { UndiciInstrumentation } =
          require('@opentelemetry/instrumentation-undici') as typeof import('@opentelemetry/instrumentation-undici');

        return new UndiciInstrumentation();
      },
      '@opentelemetry/instrumentation-runtime-node': () => {
        const { RuntimeNodeInstrumentation } =
          require('@opentelemetry/instrumentation-runtime-node') as typeof import('@opentelemetry/instrumentation-runtime-node');

        return new RuntimeNodeInstrumentation();
      },
    },
  };
}
