import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  InvoiceListContainer,
  InvoiceListItemWrapper,
  SubscriptionHistory,
  SubscriptionListContainer,
  SubscriptionListItemContent,
  SubscriptionListItemWrapper,
  isSubscriptionActive,
  isSubscriptionDeactivated,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  FullSubscriptionFragment,
  ProductType,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { Button, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';
import { useWebsiteFeature } from '../../use-website-feature';

const SubscriptionsWrapper = styled('div')`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      flex-wrap: nowrap;
      gap: ${theme.spacing(10)};
    }
  `}
`;
const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      width: 50%;
    }
  `}
`;

const UnpaidInvoiceListContainer = styled(InvoiceListContainer)`
  ${InvoiceListItemWrapper} {
    border-width: 4px;
    border-color: ${({ theme }) => theme.palette.error.main};
  }
`;

const DeactivatedSubscriptions = styled('div')`
  display: grid;
  justify-content: center;
`;

// the full width: the profile form's is too narrow for eight columns
const SubscriptionHistoryWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const onlySubscriptions = (subscriptions: FullSubscriptionFragment[]) =>
  subscriptions.filter(
    subscription =>
      subscription.memberPlan.productType === ProductType.Subscription
  );

export function ProfileSubscriptions({ className }: { className?: string }) {
  const {
    elements: { H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const showHistory = useWebsiteFeature('profile-subscription-history');

  const { data: subscriptonData } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-only',
  });

  const hasDeactivatedSubscriptions = subscriptonData?.userSubscriptions.some(
    isSubscriptionDeactivated
  );
  const hasActiveSubscriptions = subscriptonData?.userSubscriptions.some(
    subscription =>
      isSubscriptionActive(subscription) &&
      subscription.memberPlan.productType === ProductType.Subscription
  );
  const hasActiveDonations = subscriptonData?.userSubscriptions.some(
    subscription =>
      isSubscriptionActive(subscription) &&
      subscription.memberPlan.productType === ProductType.Donation
  );

  const hasUnpaidInvoices = useHasUnpaidInvoices();

  if (showHistory) {
    return (
      <SubscriptionHistoryWrapper className={className}>
        <H4 component={'h1'}>{t('subscriptionHistory.title')}</H4>

        <SubscriptionListContainer
          filter={onlySubscriptions}
          List={SubscriptionHistory}
        />

        {hasActiveDonations && (
          <>
            <H4 component={'h2'}>
              {t('user.activeSubscriptions', {
                type: ProductType.Donation,
              })}
            </H4>

            <SubscriptionListContainer
              filter={subscriptions =>
                subscriptions.filter(
                  subscription =>
                    isSubscriptionActive(subscription) &&
                    subscription.memberPlan.productType === ProductType.Donation
                )
              }
            />
          </>
        )}
      </SubscriptionHistoryWrapper>
    );
  }

  return (
    <SubscriptionsWrapper className={className}>
      {hasUnpaidInvoices && (
        <SubscriptionListWrapper>
          <H4 component={'h1'}>{t('invoice.openInvoices')}</H4>

          <UnpaidInvoiceListContainer
            filter={invoices =>
              invoices.filter(
                invoice =>
                  invoice.subscription && !invoice.canceledAt && !invoice.paidAt
              )
            }
          />
        </SubscriptionListWrapper>
      )}

      <SubscriptionListWrapper>
        <H4 component={'h1'}>
          {t('user.activeSubscriptions', {
            type: ProductType.Subscription,
          })}
        </H4>

        <SubscriptionListContainer
          filter={subscriptions =>
            subscriptions.filter(
              subscription =>
                isSubscriptionActive(subscription) &&
                subscription.memberPlan.productType === ProductType.Subscription
            )
          }
        />

        {hasActiveDonations && (
          <>
            <H4 component={'h2'}>
              {t('user.activeSubscriptions', {
                type: ProductType.Donation,
              })}
            </H4>

            <SubscriptionListContainer
              filter={subscriptions =>
                subscriptions.filter(
                  subscription =>
                    isSubscriptionActive(subscription) &&
                    subscription.memberPlan.productType === ProductType.Donation
                )
              }
            />
          </>
        )}

        {hasActiveSubscriptions && (
          <SubscriptionListItemWrapper>
            <SubscriptionListItemContent>
              <Button
                LinkComponent={Link}
                href={'/mitmachen'}
              >
                {t('user.subscribeAnother')}
              </Button>
            </SubscriptionListItemContent>
          </SubscriptionListItemWrapper>
        )}

        {hasDeactivatedSubscriptions && (
          <DeactivatedSubscriptions>
            <Link href="/profile/subscription/deactivated">
              {t('user.viewCancelledSubscriptions')}
            </Link>
          </DeactivatedSubscriptions>
        )}
      </SubscriptionListWrapper>
    </SubscriptionsWrapper>
  );
}
