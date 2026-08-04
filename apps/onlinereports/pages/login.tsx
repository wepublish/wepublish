import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { getApiUrl, handleJwtLogin } from '@wepublish/utils/website';
import {
  getApiClient,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

type LoginProps = { sessionToken?: SessionWithTokenWithoutUser };

export default function Login({ sessionToken }: LoginProps) {
  const { hasUser, setToken } = useUser();
  const router = useRouter();
  const isRedirecting = useRef(false);
  const {
    elements: { H3, Link },
  } = useWebsiteBuilder();

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
    <LoginWrapper>
      <H3 component="h1">Login für Leserinnen und Leser</H3>

      <Typography
        variant="body1"
        paragraph
      >
        (Falls Sie noch keinen Account haben,{' '}
        <Link href={'/signup'}>klicken Sie hier.</Link>)
      </Typography>

      <LoginFormContainer
        defaults={{
          email: router.query?.mail as string | undefined,
          requirePassword: !!router.query?.requirePassword,
        }}
      />
    </LoginWrapper>
  );
}

Login.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }
  const client = getApiClient(getApiUrl(), []);

  await handleJwtLogin(ctx, client, undefined);

  return {};
};
