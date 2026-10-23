import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { createServerFn } from '@tanstack/react-start';
import { ContentWrapper } from '@wepublish/content/website';
import {
  InvoiceListContainer,
  SubscriptionListContainer,
} from '@wepublish/membership/website';
import {
  InvoicesDocument,
  MeDocument,
  SubscriptionsDocument,
  SubscriptionsQuery,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
} from '../ssr';
import { withAuthGuard } from '../auth-guard';
import { useQueryParams } from '../router-hooks';

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(10)};

    & > * {
      grid-column: unset;
    }
  }
`;

const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

/**
 * TanStack port of `SubscriptionPage.getInitialProps`.
 *
 * The Next version could not return `{ notFound: true }` from
 * `getInitialProps`, so it fetched and streamed the `/404` HTML by hand
 * (`fetch404`). Here the route simply throws `notFound()` when
 * `subscriptionMissing` comes back true — no second HTTP request, and the
 * response carries a real 404.
 */
export const loadSubscription = createServerFn({ method: 'GET' })
  .validator((data: { id: string; jwt?: string }) => data)
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
    let subscriptionMissing = false;

    if (sessionToken) {
      const [subscriptions] = await Promise.all([
        client.query<SubscriptionsQuery>({ query: SubscriptionsDocument }),
        client.query({ query: InvoicesDocument }),
        client.query({ query: MeDocument }),
      ]);

      subscriptionMissing =
        !subscriptions.error &&
        !subscriptions.data?.userSubscriptions.find(
          subscription => subscription.id === data.id
        );
    }

    return {
      sessionToken,
      subscriptionMissing,
      apollo: extractCache(client),
    };
  });

function SubscriptionPageComponent() {
  const { id } = useQueryParams();
  const {
    elements: { H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const { data } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-only',
  });
  const subscription = data?.userSubscriptions.find(sub => sub.id === id);

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>
          {t('user.subscriptionsDetail', {
            type: subscription?.memberPlan.productType,
          })}
        </H4>

        <SubscriptionListContainer
          filter={subscriptions =>
            subscriptions.filter(subscription => subscription.id === id)
          }
        />
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>{t('invoice.invoices')}</H4>

        <InvoiceListContainer
          filter={invoices =>
            invoices.filter(invoice => invoice.subscriptionID === id)
          }
        />
      </SubscriptionListWrapper>

      <Link href="/profile">{t('navbar.backToProfile')}</Link>
    </SubscriptionsWrapper>
  );
}

export const SubscriptionPage = withAuthGuard(SubscriptionPageComponent);
