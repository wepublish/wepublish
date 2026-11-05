import { registerSentry } from '@wepublish/utils/website/tanstack/sentry';

/**
 * Loaded through `node --import` before the server bundle, which is the whole
 * point of it being a separate entry.
 *
 * `Sentry.init` has to run before the modules it instruments are imported.
 * Calling it at the top of `src/server.ts` — what this replaces — is too late:
 * by then the bundle's module graph is already evaluated, so the SDK reports
 * what it is handed and auto-instrumentation never attaches. Sentry documents
 * exactly this split; the in-entry version is their fallback for hosts that
 * cannot pass Node flags, and it only covers native APIs.
 *
 * It is built separately (`vite.instrument.config.mts`) rather than written by
 * hand so it shares `getServerConfig` with every other deployable instead of
 * restating the sampler and tag setup in plain JavaScript, where it would
 * drift silently.
 */
await registerSentry();
