/**
 * Shared Sentry configuration options used across all instrumentation variants.
 */
import type { SpanJSON } from '@sentry/core';

export const getBaseConfig = () => ({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENVIRONMENT,
  sendDefaultPii: true,
  tracesSampleRate: process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  release: process.env.APP_RELEASE_ID,
  beforeSendSpan: (span: SpanJSON) => {
    if (process.env.APP_NAME) {
      span.data.app_name = process.env.APP_NAME;
    }
    return span;
  },
});

export const setCommonTags = (
  Sentry: { setTag: (key: string, value: string | undefined) => void },
  component: string
) => {
  Sentry.setTag('app_name', process.env.APP_NAME);
  Sentry.setTag('component', component);
};
