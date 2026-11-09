import { createIsomorphicFn } from '@tanstack/react-start';

import type { RouterLike } from './instrumentation.client';

/**
 * The browser-side Sentry registration, in a shape server code may import.
 *
 * `instrumentation.client.ts` matches Start's `**\/*.client.*` protection
 * pattern, so importing it from `router.tsx` — which the server bundles — is
 * denied. The router still has to be the thing that registers, because the
 * browser tracing integration needs the router instance.
 *
 * `createIsomorphicFn` resolves that: the server build compiles this to a
 * no-op and never reaches the module, while the browser build loads it. The
 * inner `import()` is what keeps the Sentry SDK (replay and feedback included,
 * ~400 KB) out of the entry chunk.
 */
export const registerSentryClient = createIsomorphicFn().client(
  (router: RouterLike) => {
    void import('./instrumentation.client').then(({ registerSentryClient }) =>
      registerSentryClient(router)
    );
  }
);
