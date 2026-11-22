import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ComponentType,
  createElement,
  PropsWithChildren,
  useEffect,
} from 'react';

import { useRestrictedSession } from '../lib/restricted-session';

/**
 * The pages a restricted session may stay on, as the router names them
 * (`fullPath` of the matched route, so `/l/$code` and not the address).
 */
export const RESTRICTED_SESSION_ALLOWED_PATHS = [
  '/welcome',
  '/confirm-email',
  '/login',
  '/l/$code',
];

// The router names an index route with a trailing slash.
const withoutTrailingSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/$/, '') : path;

type RestrictedSessionRedirectProps = PropsWithChildren<{
  redirectTo?: string;
  allowedPaths?: string[];
}>;

/**
 * `withRestrictedSessionRedirect` from `@wepublish/utils/website/next` for
 * TanStack Start: a session opened by a personal login code is kept on the
 * welcome page until its steps are done.
 */
export const RestrictedSessionRedirect = ({
  children,
  redirectTo = '/welcome',
  allowedPaths = RESTRICTED_SESSION_ALLOWED_PATHS,
}: RestrictedSessionRedirectProps) => {
  const navigate = useNavigate();
  const restricted = useRestrictedSession();
  const fullPath = useRouterState({
    select: state =>
      withoutTrailingSlash(state.matches.at(-1)?.fullPath ?? '/'),
  });

  useEffect(() => {
    if (
      restricted &&
      fullPath !== redirectTo &&
      !allowedPaths.includes(fullPath)
    ) {
      navigate({ href: redirectTo, replace: true });
    }
  }, [restricted, fullPath, navigate, redirectTo, allowedPaths]);

  return <>{children}</>;
};

export const withRestrictedSessionRedirect =
  (
    redirectTo = '/welcome',
    allowedPaths: string[] = RESTRICTED_SESSION_ALLOWED_PATHS
  ) =>
  <P extends object>(Cmp: ComponentType<P>) =>
    function RestrictedSessionRedirectWrapper(props: P) {
      return (
        <RestrictedSessionRedirect
          redirectTo={redirectTo}
          allowedPaths={allowedPaths}
        >
          {createElement(Cmp, props)}
        </RestrictedSessionRedirect>
      );
    };
