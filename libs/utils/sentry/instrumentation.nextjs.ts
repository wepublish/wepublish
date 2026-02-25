/**
 * Sentry instrumentation for Next.js server-side.
 * Use in apps/.../instrumentation.ts files.
 *
 * @example
 * // apps/myapp/instrumentation.ts
 * export { onRequestError, register } from '@wepublish/utils/sentry/nextjs';
 */
import * as Sentry from '@sentry/nextjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { getBaseConfig, setCommonTags } from './config';

export async function register() {
  Sentry.init({
    ...getBaseConfig(),
    integrations: [nodeProfilingIntegration()],
    profilesSampleRate: 1.0,
  });

  setCommonTags(Sentry, 'nextjs-server');
}

export const onRequestError = Sentry.captureRequestError;
