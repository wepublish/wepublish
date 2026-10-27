import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';

import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { withAuthGuard } from '../../../auth-guard';
import { ssrAuthLink } from '../../../../lib/auth-link';
import { getSessionTokenProps } from '../../../get-session-token-props';
import { handleJwtLogin } from '../../../handle-jwt-login';
import { ComponentProps } from 'react';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  SubscriptionsDocument,
  SubscriptionsQuery,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { ContentWrapper } from '@wepublish/content/website';
import {
  HISTORY_COLUMNS_SHOWN,
  SubscriptionEdit,
  SubscriptionListContainer,
  InvoiceListContainer,
} from '@wepublish/membership/website';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { fetch404 } from '../../../fetch-404';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';

import { getApiUrl } from '../../../../lib/api-url';
import { useWebsiteFeature } from '../../../../lib/use-website-feature';

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

// the full width, like the profile's subscription history
const SubscriptionEditWrapper = styled('div')`
  container-type: inline-size;
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

/** The title, and the way back on its right; above it where it wraps. */
const SubscriptionEditTitleRow = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};

  & > * {
    margin: 0;
  }

  @container (min-width: 641px) {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;

    & > a {
      order: 1;
    }
  }
`;

// the arrow leads the way on hover
const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};

  svg {
    transition: transform 150ms ease-out;
  }

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.palette.text.primary};

    svg {
      transform: translateX(-3px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`;

/**
 * Below the invoices only where they push the title row out of sight: always
 * where the invoices stack (they are tall then), otherwise from
 * LONG_INVOICE_LIST invoices.
 */
const SubscriptionEditBottomBack = styled('div')`
  display: flex;
  justify-content: flex-end;

  ${HISTORY_COLUMNS_SHOWN} {
    &[data-long='false'] {
      display: none;
    }
  }
`;

const LONG_INVOICE_LIST = 10;

/**
 * One subscription of the reader: with the subscription history, its edit
 * page; otherwise its card next to its invoices.
 */
export function ProfileSubscription({ id }: { id: string }) {
  const {
    elements: { H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const showEdit = useWebsiteFeature('profile-subscription-history');

  const { data } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-only',
  });
  const subscription = data?.userSubscriptions.find(sub => sub.id === id);
  // the invoice list shows the cancelled ones only on request
  const { data: invoiceData } = useQuery(InvoicesDocument, {
    fetchPolicy: 'cache-only',
  });
  const shownInvoices =
    invoiceData?.userInvoices.filter(
      invoice =>
        invoice.subscriptionID === id && (invoice.paidAt || !invoice.canceledAt)
    ).length ?? 0;

  const back = (
    <BackLink href="/profile">
      <MdArrowBack aria-hidden />
      {t('navbar.backToProfile')}
    </BackLink>
  );

  if (showEdit) {
    return (
      <SubscriptionEditWrapper>
        <SubscriptionEditTitleRow>
          {back}
          <H4 component={'h1'}>{t('subscriptionEdit.title')}</H4>
        </SubscriptionEditTitleRow>

        <SubscriptionListContainer
          filter={subscriptions =>
            subscriptions.filter(subscription => subscription.id === id)
          }
          List={SubscriptionEdit}
        />

        <SubscriptionEditBottomBack
          data-long={shownInvoices >= LONG_INVOICE_LIST}
        >
          {back}
        </SubscriptionEditBottomBack>
      </SubscriptionEditWrapper>
    );
  }

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

function SubscriptionPage() {
  const {
    query: { id },
  } = useRouter();

  return <ProfileSubscription id={id as string} />;
}

const GuardedSubscription = withAuthGuard(SubscriptionPage) as NextPage<
  ComponentProps<typeof SubscriptionPage>
>;
GuardedSubscription.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, !!process.env.HTTP_ONLY_COOKIE);

  const sessionProps = await getSessionTokenProps(ctx);

  if (sessionProps.sessionToken) {
    const [subscriptions] = await Promise.all([
      client.query<SubscriptionsQuery>({
        query: SubscriptionsDocument,
      }),
      client.query({
        query: InvoicesDocument,
      }),
      client.query({
        query: MeDocument,
      }),
      client.query({
        query: NavigationListDocument,
      }),
      // tells ProfileSubscription which layout this medium has
      client.query({
        query: FeaturesDocument,
      }),
      // for the edit page's upgrade
      client.query({
        query: MemberPlanListDocument,
        variables: { take: 50, filter: { active: true } },
      }),
    ]);

    if (
      !subscriptions.error &&
      !subscriptions.data?.userSubscriptions.find(
        subscription => subscription.id === ctx.query.id
      )
    ) {
      // {notFound: true} is not supported in getInitialProps
      await fetch404(ctx);
      return {};
    }
  }

  const props = addClientCacheToProps(client, sessionProps);

  return props;
};

export { GuardedSubscription as SubscriptionPage };
