/**
 * Sentry instrumentation for Next.js client-side.
 * Use in apps/.../instrumentation-client.ts files.
 *
 * @example
 * // apps/myapp/instrumentation-client.ts
 * import '@wepublish/utils/sentry/client';
 */
import * as Sentry from '@sentry/nextjs';

import {
  getBaseConfig,
  getBrowserTracePropagationTargets,
  setCommonTags,
} from './config';

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
  profilesSampleRate: process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

setCommonTags(Sentry, 'nextjs-client');
