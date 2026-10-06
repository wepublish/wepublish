/**
 * Shared Sentry configuration options used across all instrumentation variants.
 */
import type { Integration, SamplingContext, SpanJSON } from '@sentry/core';

const tracesSampleRate = () =>
  process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0;

export const getBaseConfig = () => ({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENVIRONMENT,
  sendDefaultPii: true,
  tracesSampleRate: tracesSampleRate(),
  release: process.env.APP_RELEASE_ID,
  beforeSendSpan: (span: SpanJSON) => {
    if (process.env.APP_NAME) {
      span.data.app_name = process.env.APP_NAME;
    }
    return span;
  },
});

const isDatabaseWorkOutsideRequests = ({ name, attributes }: SamplingContext) =>
  !!attributes?.['db.system'] || name.startsWith('prisma:');

export const getServerConfig = () => ({
  ...getBaseConfig(),
  tracesSampleRate: undefined,
  tracesSampler: (context: SamplingContext) =>
    isDatabaseWorkOutsideRequests(context) ? 0 : (
      context.inheritOrSampleWith(tracesSampleRate())
    ),
});

export const withoutKeySpans = (integrations: Integration[]) =>
  integrations.filter(({ name }) => name !== 'Redis');

export const getBrowserTracePropagationTargets = () => {
  const apiUrl = process.env.API_URL;

  return apiUrl ? [/^\//, apiUrl] : [/^\//];
};

export const setCommonTags = (
  Sentry: { setTag: (key: string, value: string | undefined) => void },
  component: string
) => {
  Sentry.setTag('app_name', process.env.APP_NAME);
  Sentry.setTag('component', component);
};
