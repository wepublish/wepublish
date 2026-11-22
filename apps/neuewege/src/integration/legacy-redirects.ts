import { redirect } from '@tanstack/react-router';

type RenewalMailRedirectContext = {
  params: { _splat?: string };
  location: { searchStr: string };
};

/**
 * The renewal mail of October 2026 linked to `/p/profile?jwt=…`. The query —
 * and with it the login token — is passed on unchanged. Temporary (307), so it
 * can be dropped once those links no longer matter.
 *
 * Was `{ source: '/p/:path*', destination: '/:path*', permanent: false }` in
 * `next.config.js#redirects()`.
 */
export const renewalMailRedirect = ({
  params,
  location,
}: RenewalMailRedirectContext) => {
  throw redirect({
    href: `/${params._splat ?? ''}${location.searchStr}`,
    statusCode: 307,
  });
};
