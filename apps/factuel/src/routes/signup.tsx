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
import { Trans, useTranslation } from 'react-i18next';

import { defaultHead } from '../integration/default-head';

const SignupWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

/**
 * `pages/signup.tsx`. Its `getStaticProps` only prefetched navigation and peer
 * profile, which the root route now does for every page, so no loader is left.
 */
export const Route = createFileRoute('/signup')({
  component: SignUp,
  head: defaultHead,
});

function SignUp() {
  const { hasUser } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    elements: { H3, Link },
  } = useWebsiteBuilder();

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);

    navigate({ to: intendedRoute ?? '/profile', replace: true });
  }

  return (
    <SignupWrapper>
      <H3 component="h1">{t('signup.title')}</H3>
      <Typography
        variant="body1"
        sx={{ marginBottom: '16px' }}
      >
        <Trans
          i18nKey="signup.hasAccount"
          components={{ Link: <Link href={'/login'} /> }}
        />
      </Typography>
      <RegistrationFormContainer />
    </SignupWrapper>
  );
}
