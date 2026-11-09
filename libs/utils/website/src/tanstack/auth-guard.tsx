import { useNavigate } from '@tanstack/react-router';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
  useUser,
} from '@wepublish/authentication/website';
import { setCookie } from 'cookies-next';
import { add } from 'date-fns';
import {
  ComponentType,
  createElement,
  Fragment,
  PropsWithChildren,
} from 'react';

import { useAsPath } from './router-hooks';

/**
 * Replacement for `withAuthGuard` from `@wepublish/utils/website`.
 * Same semantics: client-side only, stores the intended route in a cookie and
 * bounces to `/login`.
 */
const AuthGuard = ({ children }: PropsWithChildren) => {
  const { hasUser } = useUser();
  const navigate = useNavigate();
  const asPath = useAsPath();

  if (!hasUser && typeof window !== 'undefined') {
    setCookie(IntendedRouteStorageKey, asPath, {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds,
      }),
    });

    navigate({ to: '/login' });
  }

  if (hasUser) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return <Fragment />;
};

export const withAuthGuard = <P extends object>(Cmp: ComponentType<P>) =>
  function AuthGuardWrapper(props: P) {
    return <AuthGuard>{createElement(Cmp, props)}</AuthGuard>;
  };
