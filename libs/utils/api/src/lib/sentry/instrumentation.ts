import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import {
  getServerConfig,
  setCommonTags,
  withoutKeySpans,
} from '@wepublish/utils';
import { getOtelConfig } from '@wepublish/utils/otel';

Sentry.init({
  ...getServerConfig(),
  integrations: defaults => [
    ...withoutKeySpans(defaults),
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(),
    ...(getOtelConfig() ? [Sentry.openTelemetryIntegration()] : []),
  ],
  // `profilesSampleRate` was removed in Sentry 11.
  profileLifecycle: 'trace',
  profileSessionSampleRate:
    process.env.APP_ENVIRONMENT === 'production' ? 0.05 : 1.0,
});

setCommonTags(Sentry, 'nestjs');
