import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { CurrentSessionDocument } from '@wepublish/website/api';
import { useRouter } from 'next/router';
import {
  ComponentType,
  createElement,
  PropsWithChildren,
  useEffect,
} from 'react';

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
  const { hasUser } = useUser();
  const { data, refetch } = useQuery(CurrentSessionDocument, {
    skip: !hasUser,
    fetchPolicy: 'cache-and-network',
  });
  const restricted = data?.currentSession.restricted ?? false;

  useEffect(() => {
    if (!hasUser) {
      return;
    }

    const onFocus = () => {
      refetch();
    };

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [hasUser, refetch]);

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
