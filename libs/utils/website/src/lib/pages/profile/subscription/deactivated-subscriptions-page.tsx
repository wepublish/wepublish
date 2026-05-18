import styled from '@emotion/styled';
import { withAuthGuard } from '../../../auth-guard';
import { ssrAuthLink } from '../../../auth-link';
import { getSessionTokenProps } from '../../../get-session-token-props';
import { handleJwtLogin } from '../../../handle-jwt-login';
import { NextPage, NextPageContext } from 'next';
import getConfig from 'next/config';
import { ComponentProps } from 'react';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import { ContentWrapper } from '@wepublish/content/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { useTranslation } from 'react-i18next';
import { Link } from '@wepublish/website/builder';

import { getApiUrl } from '../../../api-url';

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
  const client = getV1ApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, !!publicRuntimeConfig.env.HTTP_ONLY_COOKIE);

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
