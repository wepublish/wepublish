import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import {
  loginRouteLoader,
  loginSearchSchema,
} from '@wepublish/utils/website/tanstack';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { useEffect, useRef } from 'react';

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

/** `pages/login.tsx` — the copy around the form is tenant specific. */
export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  loaderDeps: ({ search: { jwt } }) => ({ jwt }),
  loader: loginRouteLoader,
  component: Login,
});

function Login() {
  const { sessionToken } = Route.useLoaderData();
  const { intended, mail, requirePassword } = Route.useSearch();
  const { hasUser, setToken } = useUser();
  const navigate = useNavigate();
  const isRedirecting = useRef(false);
  const {
    elements: { H3, Link },
  } = useWebsiteBuilder();

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken);
    }
  }, [sessionToken, setToken]);

  if (intended?.startsWith('/')) {
    setCookie(IntendedRouteStorageKey, intended, {
      expires: add(new Date(), { seconds: IntendedRouteExpiryInSeconds }),
    });
  }

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);

    if (!isRedirecting.current) {
      isRedirecting.current = true;
      navigate({ to: intendedRoute ?? '/profile', replace: true });
    }
  }

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Abonnent*innen</H3>
      <Typography
        variant="body1"
        sx={{ marginBottom: '16px' }}
      >
        (Falls du noch keinen Account hast,{' '}
        <Link href={'/signup'}>klicke hier</Link> und falls du ein Abo lösen
        willst, <Link href={'/abo'}>klicke hier.</Link>)
      </Typography>
      <LoginFormContainer
        defaults={{
          email: mail,
          requirePassword: !!requirePassword,
        }}
      />
    </LoginWrapper>
  );
}
