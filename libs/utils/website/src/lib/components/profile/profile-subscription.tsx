import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { ContentWrapper } from '@wepublish/content/website';
import {
  HISTORY_COLUMNS_SHOWN,
  InvoiceListContainer,
  SubscriptionEdit,
  SubscriptionListContainer,
} from '@wepublish/membership/website';
import {
  InvoicesDocument,
  ProductType,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';

import { useWebsiteFeature } from '../../use-website-feature';

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
          <H4 component={'h1'}>
            {t('subscriptionEdit.title', {
              type:
                subscription?.memberPlan.productType ??
                ProductType.Subscription,
            })}
          </H4>
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
