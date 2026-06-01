import styled from '@emotion/styled';
import {
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { getApiUrl, handleJwtLogin } from '@wepublish/utils/website';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { getApiClient } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

type LoginProps = { sessionToken?: SessionWithTokenWithoutUser };

export default function Login({ sessionToken }: LoginProps) {
  const { hasUser, setToken } = useUser();
  const {
    elements: { H3 },
  } = useWebsiteBuilder();
  const router = useRouter();

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken);
    }
  }, [sessionToken, setToken]);

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);
    const route = intendedRoute ?? '/';

    router.replace(route);
  }

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Member</H3>

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
