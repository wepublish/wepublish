import { createIsomorphicFn } from '@tanstack/react-start';

/**
 * Reports an error React threw while rendering, from the browser.
 *
 * The SDK is `import()`ed rather than imported so it stays out of the entry
 * chunk — the same reason `register-client.ts` does it, and worth keeping for
 * a module the default error component pulls into every page's graph. On an
 * error the extra round trip costs nothing anyone will notice, and if Sentry
 * was never registered (no DSN) `captureException` is a no-op.
 *
 * The server side is deliberately empty: `server.ts` already wraps the whole
 * fetch pipeline in `captureServerError`.
 */
export const reportRenderError = createIsomorphicFn().client(
  (error: unknown) => {
    void import('@sentry/tanstackstart-react')
      .then(Sentry => Sentry.captureException(error))
      .catch(() => undefined);
  }
);
