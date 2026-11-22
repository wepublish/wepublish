import { useRouter } from 'next/router';
import {
  ComponentType,
  createElement,
  PropsWithChildren,
  useEffect,
} from 'react';

import { useRestrictedSession } from '../lib/restricted-session';

export const RESTRICTED_SESSION_ALLOWED_PATHS = [
  '/welcome',
  '/confirm-email',
  '/login',
  '/l/[code]',
];

type RestrictedSessionRedirectProps = PropsWithChildren<{
  redirectTo: string;
  allowedPaths: string[];
}>;

const RestrictedSessionRedirect = ({
  children,
  redirectTo,
  allowedPaths,
}: RestrictedSessionRedirectProps) => {
  const router = useRouter();
  const restricted = useRestrictedSession();

  useEffect(() => {
    if (
      restricted &&
      router.pathname !== redirectTo &&
      !allowedPaths.includes(router.pathname)
    ) {
      router.replace(redirectTo);
    }
  }, [restricted, router, redirectTo, allowedPaths]);

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
