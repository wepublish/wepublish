import {
  useUser,
  IntendedRouteStorageKey,
  IntendedRouteExpiryInSeconds,
} from '@wepublish/authentication/website';
import { setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { useRouter } from 'next/router';
import { ComponentType, Fragment, PropsWithChildren } from 'react';

const AuthGuard = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const { hasUser } = useUser();

  if (!hasUser && typeof window !== 'undefined') {
    setCookie(IntendedRouteStorageKey, router.asPath, {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds,
      }),
    });

    router.push('/login');
  }

  if (hasUser) {
    return <>{children}</>;
  }

  return <Fragment />;
};

export const withAuthGuard = <P extends object>(Cmp: ComponentType<P>) =>
  function AuthGuardWrapper(props: P) {
    return (
      <AuthGuard>
        <Cmp {...props} />
      </AuthGuard>
    );
  };
