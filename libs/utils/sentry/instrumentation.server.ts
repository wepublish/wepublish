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
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const integrations = [];

    try {
      const { nodeProfilingIntegration } = await import(
        '@sentry/profiling-node'
      );
      integrations.push(nodeProfilingIntegration() as any);
    } catch {
      // Native binary not available (e.g. Next.js standalone mode)
    }

    Sentry.init({
      ...getBaseConfig(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      integrations,
    });

    setCommonTags(Sentry, 'server');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      ...getBaseConfig(),
    });

    setCommonTags(Sentry, 'edge');
  }
}

export const onRequestError = Sentry.captureRequestError;
