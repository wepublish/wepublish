import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { css } from '@mui/material';
import { createServerFn } from '@tanstack/react-start';
import { ContentWrapper } from '@wepublish/content/website';
import {
  InvoiceListContainer,
  InvoiceListItemWrapper,
  SubscriptionListContainer,
  SubscriptionListItemContent,
  SubscriptionListItemWrapper,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  PersonalDataFormContainer,
  TotpSetupContainer,
} from '@wepublish/user/website';
import {
  InvoicesDocument,
  MeDocument,
  NavigationListDocument,
  ProductType,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { Button, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
} from '../ssr';
import { withAuthGuard } from '../auth-guard';
import { useQueryParams } from '../router-hooks';

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

export const ProfileWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

/**
 * TanStack port of `ProfilePage.getInitialProps`.
 *
 * Stays a `createServerFn` (rather than a plain loader against the router's
 * Apollo client) for two reasons: it needs the auth cookie, and it may mint a
 * session from `?jwt=`. The route merges the returned cache into the router
 * client with `mergeApolloCache`.
 */
export const loadProfile = createServerFn({ method: 'GET' })
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
        client.query({ query: NavigationListDocument }),
        client.query({ query: InvoicesDocument }),
        client.query({ query: SubscriptionsDocument }),
      ]);
    }

    return { sessionToken, apollo: extractCache(client) };
  });

type ProfilePageProps = Omit<
  ComponentProps<typeof PersonalDataFormContainer>,
  ''
> & { className?: string };

function ProfilePageComponent({ className, ...props }: ProfilePageProps) {
  const {
    elements: { H4, Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  // The confirm-email page confirms the token from the confirmation link and
  // sends the reader here once the new address is in place.
  const query = useQueryParams();

  const { data: subscriptonData } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-only',
  });

  const hasDeactivatedSubscriptions = subscriptonData?.userSubscriptions.some(
    subscription => subscription.deactivation
  );
  const hasActiveSubscriptions = subscriptonData?.userSubscriptions.some(
    subscription =>
      !subscription.deactivation &&
      subscription.memberPlan.productType === ProductType.Subscription
  );
  const hasActiveDonations = subscriptonData?.userSubscriptions.some(
    subscription =>
      !subscription.deactivation &&
      subscription.memberPlan.productType === ProductType.Donation
  );

  const hasUnpaidInvoices = useHasUnpaidInvoices();

  return (
    <>
      {query.emailConfirmed && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}

      <SubscriptionsWrapper className={className}>
        {hasUnpaidInvoices && (
          <SubscriptionListWrapper>
            <H4 component={'h1'}>{t('invoice.openInvoices')}</H4>

            <UnpaidInvoiceListContainer
              filter={invoices =>
                invoices.filter(
                  invoice =>
                    invoice.subscription &&
                    !invoice.canceledAt &&
                    !invoice.paidAt
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
                  !subscription.deactivation &&
                  subscription.memberPlan.productType ===
                    ProductType.Subscription
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
                      !subscription.deactivation &&
                      subscription.memberPlan.productType ===
                        ProductType.Donation
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

      <ProfileWrapper className={className}>
        <H4 component={'h1'}>{t('navbar.profile')}</H4>

        <PersonalDataFormContainer {...props} />

        <TotpSetupContainer />
      </ProfileWrapper>
    </>
  );
}

export const ProfilePage = withAuthGuard(ProfilePageComponent);
