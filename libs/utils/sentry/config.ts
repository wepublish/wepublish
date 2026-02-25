/**
 * Shared Sentry configuration options used across all instrumentation variants.
 */

export const getBaseConfig = () => ({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  release: process.env.APP_RELEASE_ID,
});

export const setCommonTags = (
  Sentry: { setTag: (key: string, value: string | undefined) => void },
  component: string
) => {
  Sentry.setTag('app_name', process.env.APP_NAME);
  Sentry.setTag('component', component);
};
