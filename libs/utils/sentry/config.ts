/**
 * Shared Sentry configuration options used across all instrumentation variants.
 */

export const getBaseConfig = () => ({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  release: process.env.APP_RELEASE_ID,
  tracesSampleRate: process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: 'trace',
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const setCommonTags = (
  Sentry: { setTag: (key: string, value: string | undefined) => void },
  component: string
) => {
  Sentry.setTag('app_name', process.env.APP_NAME);
  Sentry.setTag('component', component);
};
