/**
 * Sentry instrumentation for NestJS applications.
 * Import at the top of your main.ts before any other imports.
 *
 * @example
 * // apps/api-example/src/main.ts
 * import '@wepublish/utils/sentry/nestjs';
 * // ... rest of imports
 */
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { getServerConfig, setCommonTags, withoutKeySpans } from './config';

Sentry.init({
  ...getServerConfig(),
  integrations: defaults => [
    ...withoutKeySpans(defaults),
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(),
  ],
  // `profilesSampleRate` was removed in Sentry 11.
  profileLifecycle: 'trace',
  profileSessionSampleRate:
    process.env.APP_ENVIRONMENT === 'production' ? 0.05 : 1.0,
});

setCommonTags(Sentry, 'nestjs');
