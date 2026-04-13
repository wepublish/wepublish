/**
 * Sentry instrumentation for Next.js server-side.
 * Use in apps/.../instrumentation.ts files.
 *
 * @example
 * // apps/myapp/instrumentation.ts
 * export { onRequestError, register } from '@wepublish/utils/sentry/nextjs';
 */
import * as Sentry from '@sentry/nextjs';

import { getBaseConfig, setCommonTags } from './config';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

    Sentry.init({
      ...getBaseConfig(),
      integrations: [nodeProfilingIntegration()],
      profilesSampleRate:
        process.env.APP_ENVIRONMENT === 'production' ? 0.05 : 1.0,
    });

    setCommonTags(Sentry, 'nextjs-server');
  }
}

export const onRequestError = Sentry.captureRequestError;
