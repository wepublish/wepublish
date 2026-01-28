import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  AuthTokenStorageKey,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { getSessionTokenProps } from '@wepublish/utils/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { getV1ApiClient, LoginWithJwtDocument } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
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
      <H3 component="h1">Login für Abonnent*innen</H3>

      <Typography
        variant="body1"
        paragraph
      >
        (Falls du noch keinen Account hast,{' '}
        <Link href={'/signup'}>klicke hier.</Link>)
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

  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);

  if (ctx.query.jwt) {
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt,
      },
    });

    setCookie(
      AuthTokenStorageKey,
      JSON.stringify(
        data.data.createSessionWithJWT as SessionWithTokenWithoutUser
      ),
      {
        req: ctx.req,
        res: ctx.res,
        expires: new Date(data.data.createSessionWithJWT.expiresAt),
        sameSite: 'strict',
      }
    );

    return await getSessionTokenProps(ctx);
  }

  return {};
};
