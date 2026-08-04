import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
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
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (hasUser) {
      router.replace('/');
    }
  }, [router, hasUser]);

  return (
    <SignupWrapper>
      <H3 component="h1">Registriere dich noch heute</H3>

      <Typography
        variant="body1"
        paragraph
      >
        (Falls du schon einen Account hast,{' '}
        <Link href={'/login'}>klicke hier.</Link>)
      </Typography>

      <RegistrationFormContainer />
    </SignupWrapper>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  if (!getApiUrl()) {
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
