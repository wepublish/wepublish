import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  IntendedRouteStorageKey,
  RegistrationFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie } from 'cookies-next';
import { useEffect, useRef } from 'react';

const SignupWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

/**
 * `pages/signup.tsx`. Its `getStaticProps` only prefetched navigation, footer
 * and peer profile, which the root route now does for every page.
 */
export const Route = createFileRoute('/signup')({
  component: SignUp,
  head: () => ({ meta: [{ title: 'Registrieren | Reflekt' }] }),
});

function SignUp() {
  const { hasUser } = useUser();
  const navigate = useNavigate();
  const isRedirecting = useRef(false);
  const {
    elements: { H3, Link },
  } = useWebsiteBuilder();

  useEffect(() => {
    if (!hasUser || isRedirecting.current) {
      return;
    }

    isRedirecting.current = true;

    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);

    navigate({ to: intendedRoute ?? '/profile', replace: true });
  }, [hasUser, navigate]);

  return (
    <SignupWrapper>
      <H3 component="h1">Registriere dich noch heute</H3>
      <Typography
        variant="body1"
        sx={{ marginBottom: '16px' }}
      >
        (Falls du schon einen Account hast,{' '}
        <Link href={'/login'}>klicke hier.</Link>)
      </Typography>
      <RegistrationFormContainer />
    </SignupWrapper>
  );
}
