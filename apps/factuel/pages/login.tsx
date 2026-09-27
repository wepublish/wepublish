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
import { Trans, useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      <H3 component="h1">{t('login.title')}</H3>

      <Typography
        variant="body1"
        paragraph
      >
        <Trans
          i18nKey="login.noAccount"
          components={{ Link: <Link href={'/signup'} /> }}
        />
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
