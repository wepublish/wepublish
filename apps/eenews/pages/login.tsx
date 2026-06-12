import styled from '@emotion/styled';
import { Typography } from '@mui/material';
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
import { useEffect, useRef } from 'react';

import { EenewsPageShell } from '../src/components/eenews-page-shell';

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
  gap: 28px;
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
    <EenewsPageShell>
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
    </EenewsPageShell>
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
