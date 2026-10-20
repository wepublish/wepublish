import * as Sentry from '@sentry/nextjs';

import {
  getBaseConfig,
  getBrowserTracePropagationTargets,
  setCommonTags,
} from '@wepublish/utils';

Sentry.init({
  ...getBaseConfig(),
  tracePropagationTargets: getBrowserTracePropagationTargets(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
    Sentry.browserProfilingIntegration(),
    Sentry.graphqlClientIntegration({
      endpoints: [/.*/],
    }),
  ],
  profileLifecycle: 'trace',
  profileSessionSampleRate:
    process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

setCommonTags(Sentry, 'nextjs-client');
