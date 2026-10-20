import type {
  Integration,
  SamplingContext,
  StreamedSpanJSON,
  TracesSamplerSamplingContext,
} from '@sentry/core';

type SentryEnv = {
  APP_ENVIRONMENT?: string;
  SENTRY_DSN?: string;
  APP_RELEASE_ID?: string;
  APP_NAME?: string;
  API_URL?: string;
};

const tracesSampleRate = () =>
  (process.env as SentryEnv).APP_ENVIRONMENT === 'production' ? 0.1 : 1.0;

export const getBaseConfig = () => ({
  dsn: (process.env as SentryEnv).SENTRY_DSN,
  environment: (process.env as SentryEnv).APP_ENVIRONMENT,
  sendDefaultPii: true,
  tracesSampleRate: tracesSampleRate(),
  release: (process.env as SentryEnv).APP_RELEASE_ID,
  // Span streaming is the default in Sentry 11, so spans carry `attributes`
  // rather than the `data` bag they had in 10.
  beforeSendSpan: (span: StreamedSpanJSON) => {
    if ((process.env as SentryEnv).APP_NAME) {
      span.attributes['app_name'] = (process.env as SentryEnv).APP_NAME;
    }

    return span;
  },
});

const isDatabaseWorkOutsideRequests = ({ name, attributes }: SamplingContext) =>
  !!attributes?.['db.system'] || name.startsWith('prisma:');

export const getServerConfig = () => ({
  ...getBaseConfig(),
  tracesSampleRate: undefined,
  // Sentry 11 moved `inheritOrSampleWith` onto its own context type.
  tracesSampler: (context: TracesSamplerSamplingContext) =>
    isDatabaseWorkOutsideRequests(context) ? 0 : (
      context.inheritOrSampleWith(tracesSampleRate())
    ),
});

export const withoutKeySpans = (integrations: Integration[]) =>
  integrations.filter(({ name }) => name !== 'Redis');

export const getBrowserTracePropagationTargets = () => {
  const apiUrl = (process.env as SentryEnv).API_URL;

  return apiUrl ? [/^\//, apiUrl] : [/^\//];
};

export const setCommonTags = (
  Sentry: { setTag: (key: string, value: string | undefined) => void },
  component: string
) => {
  Sentry.setTag('app_name', (process.env as SentryEnv).APP_NAME);
  Sentry.setTag('component', component);
};
