import type * as SentryTypes from '@sentry/react';
import {
  getBaseConfig,
  getBrowserTracePropagationTargets,
  setCommonTags,
} from '@wepublish/utils';

export type RouterLike = Parameters<
  typeof SentryTypes.tanstackRouterBrowserTracingIntegration
>[0];

export const registerSentryClient = async (router: RouterLike) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import('@sentry/react');

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
