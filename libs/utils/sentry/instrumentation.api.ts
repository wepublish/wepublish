/**
 * Sentry instrumentation for NestJS applications.
 * Import at the top of your main.ts before any other imports.
 *
 * @example
 * // apps/api-example/src/main.ts
 * import '@wepublish/utils/sentry/api';
 * // ... rest of imports
 */
import * as Sentry from '@sentry/nestjs';
import { graphqlIntegration, prismaIntegration } from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { getBaseConfig, setCommonTags } from './config';

Sentry.init({
  ...getBaseConfig(),
  integrations: [
    nodeProfilingIntegration(),
    prismaIntegration(),
    graphqlIntegration(),
  ],
  profilesSampleRate: 1.0,
});

setCommonTags(Sentry, 'api');
