import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  AuthTokenStorageKey,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { ContentWrapper } from '@wepublish/content/website';
import { getSessionTokenProps } from '@wepublish/utils/website';
import {
  getV1ApiClient,
  LoginWithJwtDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { Container } from '../src/components/layout/container';

const LoginWrapper = styled(ContentWrapper)`
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
    <Container>
      <LoginWrapper>
        <div>
          <H3 component="h1">Login für Abonnent*innen</H3>

          {!router.query?.mail ?
            <Typography sx={{ marginTop: 2 }}>
              Falls du noch keinen Account hast,{' '}
              <Link
                href={
                  '/mitmachen?memberPlanBySlug=bajour-member&additionalMemberPlans=upsell'
                }
              >
                klicke hier.
              </Link>
            </Typography>
          : <Typography sx={{ marginTop: 2 }}>
              So schön, bist du da. Aus Sicherheitsgründen müssen wir den Umweg
              über ein E-Mail gehen, das wir dir sofort zuschicken. Darin
              enthalten ist ein Link, mit dem du dein Abo einfach und schnell
              abschliessen kannst.
            </Typography>
          }
        </div>

        <LoginFormContainer
          defaults={{
            email: router.query?.mail as string | undefined,
            requirePassword: !!router.query?.requirePassword,
          }}
          disablePasswordLogin={!!router.query?.mail}
        />
      </LoginWrapper>
    </Container>
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
