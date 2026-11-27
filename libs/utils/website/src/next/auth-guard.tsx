import {
  useUser,
  IntendedRouteStorageKey,
  IntendedRouteExpiryInSeconds,
  sanitizeIntendedRoute,
} from '@wepublish/authentication/website';
import { setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { useRouter } from 'next/router';
import {
  ComponentType,
  createElement,
  PropsWithChildren,
  Fragment,
} from 'react';

const AuthGuard = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const { hasUser } = useUser();

  if (!hasUser && typeof window !== 'undefined') {
    setCookie(IntendedRouteStorageKey, sanitizeIntendedRoute(router.asPath), {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds,
      }),
    });

    router.push('/login');
  }

  if (hasUser) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment />;
};

export const withAuthGuard = <P extends object>(Cmp: ComponentType<P>) =>
  function AuthGuardWrapper(props: P) {
    return <AuthGuard>{createElement(Cmp, props)}</AuthGuard>;
  };
