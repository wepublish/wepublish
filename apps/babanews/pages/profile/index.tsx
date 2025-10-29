import styled from '@emotion/styled';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { ContentWrapper } from '@wepublish/content/website';
import { PersonalDataFormContainer } from '@wepublish/user/website';
import {
  getSessionTokenProps,
  ssrAuthLink,
  withAuthGuard,
} from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  LoginWithJwtDocument,
  MeDocument,
  NavigationListDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import getConfig from 'next/config';

const ProfileWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

function Profile() {
  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  return (
    <ProfileWrapper>
      <H4 component={'h1'}>Profil</H4>

      <PersonalDataFormContainer mediaEmail="info@wepublish.dev" />
    </ProfileWrapper>
  );
}

const GuardedProfile = withAuthGuard(Profile);

export { GuardedProfile as default };
(GuardedProfile as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

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
  }

  const sessionProps = await getSessionTokenProps(ctx);

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({
        query: MeDocument,
      }),
      client.query({
        query: NavigationListDocument,
      }),
    ]);
  }

  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};
