/**
 * Sentry instrumentation for standalone React applications.
 * Import at the top of your entry file (e.g., main.tsx).
 *
 * @example
 * // apps/editor/src/main.tsx
 * import '@wepublish/utils/sentry/react';
 * // ... rest of imports
 */
import * as Sentry from '@sentry/react';

import { getBaseConfig, setCommonTags } from './config';

Sentry.init({
  ...getBaseConfig(),
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

setCommonTags(Sentry, 'react');
