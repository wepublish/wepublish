import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  IntendedRouteStorageKey,
  RegistrationFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { deleteCookie, getCookie } from 'cookies-next';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';

const SignupWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

export default function SignUp() {
  const { hasUser } = useUser();
  const router = useRouter();
  const {
    elements: { H3, Link },
  } = useWebsiteBuilder();

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString();
    deleteCookie(IntendedRouteStorageKey);
    const route = intendedRoute ?? '/profile';

    router.replace(route);
  }

  return (
    <SignupWrapper>
      <H3 component="h1">Registrieren Sie sich noch heute</H3>

      <Typography
        variant="body1"
        paragraph
      >
        (Falls Sie schon einen Account haben,{' '}
        <Link href={'/login'}>klicken Sie hier.</Link>)
      </Typography>

      <RegistrationFormContainer fields={['firstName']} />
    </SignupWrapper>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!process.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
