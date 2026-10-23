import { createServerFn } from '@tanstack/react-start';
import { getPublicEnv } from '@wepublish/utils/website/tanstack/server';

/**
 * Runtime (not build-time) configuration for the browser.
 *
 * `next.config.js#env` inlined `API_URL` at build time, which meant a rebuild
 * per environment. Vite's `define` does the same and is kept as a fallback,
 * but the authoritative value is read from the server's real `process.env`
 * here and shipped to the browser through `window.PUBLIC_ENV`, so one image
 * can serve staging and production.
 */
export const getPublicEnvFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getPublicEnv();
  }
);
