import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { PageContainer } from '@wepublish/page/website';
import { getApiUrl, handleJwtLogin } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  PageDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { getApiClient } from '@wepublish/website/api';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { HauptstadtContentFullWidth } from '../src/components/hauptstadt-content-wrapper';

type LoginProps = { sessionToken?: SessionWithTokenWithoutUser };

export default function Login({ sessionToken }: LoginProps) {
  const { hasUser, setToken } = useUser();
  const router = useRouter();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken);
    }
  }, [sessionToken, setToken]);

  if (
    router.query.intended &&
    (router.query.intended as string).startsWith('/')
  ) {
    setCookie(IntendedRouteStorageKey, router.query.intended, {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds,
      }),
    });
  }

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);
    const route = intendedRoute ?? '/profile';

    if (!isRedirecting.current) {
      router.replace(route);
      isRedirecting.current = true;
    }
  }

  return (
    <PageContainer slug="login">
      <HauptstadtContentFullWidth>
        <LoginFormContainer
          defaults={{
            email: router.query?.mail as string | undefined,
            requirePassword: !!(router.query?.requirePassword ?? true),
          }}
        />
      </HauptstadtContentFullWidth>
    </PageContainer>
  );
}

Login.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }
  const client = getApiClient(getApiUrl(), []);

  await handleJwtLogin(ctx, client, true);

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'login',
      },
    }),
  ]);
  const props = addClientCacheToProps(client, {});

  return props;
};
