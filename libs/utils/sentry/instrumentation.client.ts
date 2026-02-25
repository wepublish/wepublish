/**
 * Sentry instrumentation for Next.js client-side.
 * Use in apps/.../sentry.client.config.ts files.
 *
 * @example
 * // apps/myapp/sentry.client.config.ts
 * import '@wepublish/utils/sentry/client';
 */
import * as Sentry from '@sentry/nextjs';

import { getBaseConfig, setCommonTags } from './config';

Sentry.init({
  ...getBaseConfig(),
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

setCommonTags(Sentry, 'nextjs-client');
