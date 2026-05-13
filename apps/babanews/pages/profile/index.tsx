import styled from '@emotion/styled';
import { ContentWrapper } from '@wepublish/content/website';
import { PersonalDataFormContainer } from '@wepublish/user/website';
import {
  getApiUrl,
  getSessionTokenProps,
  handleJwtLogin,
  ssrAuthLink,
  withAuthGuard,
} from '@wepublish/utils/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  MeDocument,
  NavigationListDocument,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPageContext } from 'next';
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

      <PersonalDataFormContainer />
    </ProfileWrapper>
  );
}

const GuardedProfile = withAuthGuard(Profile);

export { GuardedProfile as default };
(GuardedProfile as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }
  const client = getV1ApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, undefined);

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
