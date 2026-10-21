import * as Sentry from '@sentry/nextjs';

import {
  getServerConfig,
  setCommonTags,
  withoutKeySpans,
} from '@wepublish/utils';
import { getOtelConfig } from '@wepublish/utils/otel';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { forbidCachingErrors } = await import('./error-no-store');
    forbidCachingErrors();

    const otelConfig = getOtelConfig();
    const otel =
      otelConfig ?
        (await import('../otel/otel.node')).startWebsiteOtel(otelConfig)
      : undefined;

    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

    Sentry.init({
      ...getServerConfig(),
      ...(otel?.traces ? { enableOpenTelemetrySetup: false } : {}),
      integrations: defaults => [
        ...withoutKeySpans(defaults),
        nodeProfilingIntegration(),
        ...(otel?.traces ? [Sentry.openTelemetryIntegration()] : []),
      ],
      profileLifecycle: 'trace',
      profileSessionSampleRate:
        process.env.APP_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    });

    setCommonTags(Sentry, 'nextjs-server');
  }
}

export const onRequestError = Sentry.captureRequestError;
