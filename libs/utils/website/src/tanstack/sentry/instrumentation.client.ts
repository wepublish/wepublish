import * as Sentry from '@sentry/react';
import {
  getBaseConfig,
  getBrowserTracePropagationTargets,
  setCommonTags,
} from '@wepublish/utils';

type RouterLike = Parameters<
  typeof Sentry.tanstackRouterBrowserTracingIntegration
>[0];

export const registerSentryClient = (router: RouterLike) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    Sentry.init({
      ...getBaseConfig(),
      tracePropagationTargets: getBrowserTracePropagationTargets(),
      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: true,
        }),
        Sentry.browserProfilingIntegration(),
        Sentry.graphqlClientIntegration({ endpoints: [/.*/] }),
      ],
      profileLifecycle: 'trace',
      profileSessionSampleRate:
        process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    setCommonTags(Sentry, 'tanstack-client');
  } catch (error) {
    console.error('[sentry] client registration failed, continuing', error);
  }
};
