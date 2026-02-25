/**
 * Sentry instrumentation for Next.js client-side.
 * Use in apps/.../sentry.client.config.ts files.
 *
 * @example
 * // apps/myapp/sentry.client.config.ts
 * import '@wepublish/utils/sentry/website';
 */
import * as Sentry from '@sentry/nextjs';

import { getBaseConfig, setCommonTags } from './config';

Sentry.init({
  ...getBaseConfig(),
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
});

setCommonTags(Sentry, 'website');
