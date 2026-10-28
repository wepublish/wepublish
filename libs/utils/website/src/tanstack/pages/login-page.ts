import { createServerFn } from '@tanstack/react-start';

import {
  createAuthenticatedSsrClient,
  extractCache,
  handleJwtLogin,
} from '../ssr';

/**
 * Server half of `pages/login.tsx`: exchange a `?jwt=` magic-link token for a
 * session cookie. TOTP-protected accounts fall through to the client-side
 * `withJwtHandler`, which prompts for the code — same as the Next version.
 */
export const loadLogin = createServerFn({ method: 'GET' })
  .validator((data: { jwt?: string }) => data)
  .handler(async ({ data }) => {
    const { client } = createAuthenticatedSsrClient();

    const sessionToken = await handleJwtLogin(
      client,
      data.jwt,
      !!process.env.HTTP_ONLY_COOKIE
    );

    return { sessionToken, apollo: extractCache(client) };
  });
