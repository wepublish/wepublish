/**
 * Sentry instrumentation for Next.js server-side.
 * Use in apps/.../instrumentation.ts files.
 *
 * @example
 * // apps/myapp/instrumentation.ts
 * export { onRequestError, register } from '@wepublish/utils/sentry/server';
 */
import * as Sentry from '@sentry/nextjs';

import { getBaseConfig, setCommonTags } from './config';

export async function register() {
  const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

  Sentry.init({
    ...getBaseConfig(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    integrations: [nodeProfilingIntegration() as any],
  });

  setCommonTags(Sentry, 'server');
}

export const onRequestError = Sentry.captureRequestError;
