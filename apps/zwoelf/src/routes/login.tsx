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
  searchText,
} from '@wepublish/utils/website/tanstack';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { useEffect, useRef } from 'react';

import { defaultHead } from '../integration/default-head';
import { LoginWrapper } from '../login-wrapper';

/** `pages/login.tsx` — the copy around the form is tenant specific. */
export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  loaderDeps: ({ search: { jwt } }) => ({ jwt }),
  loader: loginRouteLoader,
  component: Login,
  head: defaultHead,
});

function Login() {
  const { sessionToken } = Route.useLoaderData();
  const { intended, mail, requirePassword, ...search } = Route.useSearch();
  // As text: the router reads a code of digits only as a number.
  const loginCode = searchText(search.loginCode);
  const { hasUser, setToken } = useUser();
  const navigate = useNavigate();
  const isRedirecting = useRef(false);
  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken);
    }
  }, [sessionToken, setToken]);

  // In effects, not during render: a render React repeats or throws away
  // would consume the intended route twice.
  useEffect(() => {
    if (intended?.startsWith('/')) {
      setCookie(IntendedRouteStorageKey, intended, {
        expires: add(new Date(), { seconds: IntendedRouteExpiryInSeconds }),
      });
    }
  }, [intended]);

  useEffect(() => {
    if (!hasUser || isRedirecting.current) {
      return;
    }

    isRedirecting.current = true;

    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);

    // A reader who logged in with their personal code goes through the
    // welcome steps; everyone else to where they were headed.
    navigate({
      href: loginCode ? '/welcome' : (intendedRoute ?? '/after-login'),
      replace: true,
    });
  }, [hasUser, navigate, loginCode]);

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Member</H3>

      <LoginFormContainer
        defaults={{
          email: mail,
          requirePassword: !!requirePassword,
          loginCode,
          useLoginCode: !!loginCode,
        }}
      />
    </LoginWrapper>
  );
}
