import styled from '@emotion/styled';
import { withAuthGuard } from '../../../auth-guard';
import { ssrAuthLink } from '../../../auth-link';
import { getSessionTokenProps } from '../../../get-session-token-props';
import { setCookie } from 'cookies-next';
import { NextPage, NextPageContext } from 'next';
import getConfig from 'next/config';
import { ComponentProps } from 'react';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import { ContentWrapper } from '@wepublish/content/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  LoginWithJwtDocument,
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { useTranslation } from 'react-i18next';
import { Link } from '@wepublish/website/builder';

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`;

function DeactivatedSubscriptions() {
  const { t } = useTranslation();

  return (
    <SubscriptionsWrapper>
      <h1>{t('user.cancelledSubscriptions')}</h1>

      <SubscriptionListContainer
        filter={subscriptions =>
          subscriptions.filter(subscription => subscription.deactivation)
        }
      />

      <Link href="/profile">Zurück zum Profil</Link>
    </SubscriptionsWrapper>
  );
}

const GuardedDeactivatedSubscriptions = withAuthGuard(
  DeactivatedSubscriptions
) as NextPage<ComponentProps<typeof DeactivatedSubscriptions>>;
GuardedDeactivatedSubscriptions.getInitialProps = async (
  ctx: NextPageContext
) => {
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
        httpOnly: !!publicRuntimeConfig.env.HTTP_ONLY_COOKIE,
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
        query: SubscriptionsDocument,
      }),
      client.query({
        query: NavigationListDocument,
      }),
    ]);
  }

  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};

export { GuardedDeactivatedSubscriptions as DeactivatedSubscriptionsPage };
