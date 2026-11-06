import styled from '@emotion/styled';
import { createServerFn } from '@tanstack/react-start';
import { ContentWrapper } from '@wepublish/content/website';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import {
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
} from '../ssr';
import { withAuthGuard } from '../auth-guard';

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`;

/** TanStack port of `DeactivatedSubscriptionsPage.getInitialProps`. */
export const loadDeactivatedSubscriptions = createServerFn({ method: 'GET' })
  .validator((data: { jwt?: string }) => data)
  .handler(async ({ data }) => {
    const { client, setToken } = createAuthenticatedSsrClient();

    const minted = await handleJwtLogin(
      client,
      data.jwt,
      !!process.env.HTTP_ONLY_COOKIE
    );

    if (minted) {
      setToken(minted.token);
    }

    const sessionToken = minted ?? getRequestSessionToken();

    if (sessionToken) {
      await Promise.all([
        client.query({ query: MeDocument }),
        client.query({ query: SubscriptionsDocument }),
        client.query({ query: NavigationListDocument }),
      ]);
    }

    return { sessionToken, apollo: extractCache(client) };
  });

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

      <Link href="/profile">{t('navbar.backToProfile')}</Link>
    </SubscriptionsWrapper>
  );
}

export const DeactivatedSubscriptionsPage = withAuthGuard(
  DeactivatedSubscriptions
);
