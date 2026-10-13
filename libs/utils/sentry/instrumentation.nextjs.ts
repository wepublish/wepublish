/**
 * Sentry instrumentation for Next.js server-side.
 * Use in apps/.../instrumentation.ts files.
 *
 * @example
 * // apps/myapp/instrumentation.ts
 * export { onRequestError, register } from '@wepublish/utils/sentry/nextjs';
 */
import * as Sentry from '@sentry/nextjs';

import { getServerConfig, setCommonTags, withoutKeySpans } from './config';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { forbidCachingErrors } = await import('./error-no-store');
    forbidCachingErrors();

    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

    Sentry.init({
      ...getServerConfig(),
      integrations: defaults => [
        ...withoutKeySpans(defaults),
        nodeProfilingIntegration(),
      ],
      profileLifecycle: 'trace',
      profileSessionSampleRate:
        process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    });

    setCommonTags(Sentry, 'nextjs-server');
  }
}

export const onRequestError = Sentry.captureRequestError;
