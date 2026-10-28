import * as Sentry from '@sentry/tanstackstart-react';
import {
  getServerConfig,
  setCommonTags,
  withoutKeySpans,
} from '@wepublish/utils';

/**
 * `@sentry/tanstackstart-react` resolves to its *server* build here, which is
 * `@sentry/node` plus the Start-aware `init` and the request/server-function
 * instrumentation. Importing `@sentry/node` directly — what this used to do —
 * configures a different client than the one `wrapFetchWithSentry` and the
 * global middlewares reach for, so spans and errors end up on two clients and
 * only one of them has a DSN.
 */
export async function registerSentry() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // Never let observability take the site down. The server entry awaits this
  // at module scope, so a rejection here would fail the whole module and every
  // request after it — including the k8s health probe, which would then
  // restart-loop the pod.
  try {
    const { forbidCachingErrors } =
      await import('../../lib/sentry/error-no-store');
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

    setCommonTags(Sentry, 'tanstack-server');
  } catch (error) {
    console.error('[sentry] server registration failed, continuing', error);
  }
}

export const captureServerError = (error: unknown) => {
  Sentry.captureException(error);
};

export { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
