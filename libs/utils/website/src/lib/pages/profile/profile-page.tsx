import styled from '@emotion/styled';
import { css } from '@mui/material';
import { useApolloClient } from '@apollo/client';
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
  addClientCacheToProps,
  getApiClient,
  MeDocument,
  NavigationListDocument,
  InvoicesDocument,
  SubscriptionsDocument,
  ProductType,
  useConfirmEmailChangeMutation,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { Button, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPage, NextPageContext } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ComponentProps, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { handleJwtLogin } from '../../handle-jwt-login';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';

import { getApiUrl } from '../../api-url';

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

type ProfilePageProps = Omit<
  ComponentProps<typeof PersonalDataFormContainer>,
  ''
> & { className?: string };

function ProfilePage({ className, ...props }: ProfilePageProps) {
  const {
    elements: { H4, Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const [confirmEmailChange, { data: confirmData, error: confirmError }] =
    useConfirmEmailChangeMutation();

  useEffect(() => {
    const newEmail = router.query.confirmEmailChange as string | undefined;

    if (newEmail) {
      const { confirmEmailChange: _, jwt: __, ...query } = router.query;
      confirmEmailChange({ variables: { newEmail } })
        .then(async () => {
          await router.replace({ pathname: '/profile', query }, undefined, {
            shallow: true,
          });
          await client.refetchQueries({ include: ['Me'] });
        })
        .catch(async () => {
          await router.replace({ pathname: '/profile', query }, undefined, {
            shallow: true,
          });
        });
    }
  }, [router.query.confirmEmailChange, confirmEmailChange, router]);

  const { data: subscriptonData } = useSubscriptionsQuery({
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
      {confirmData && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}

      {confirmError && <Alert severity="error">{confirmError.message}</Alert>}

      <SubscriptionsWrapper className={className}>
        {hasUnpaidInvoices && (
          <SubscriptionListWrapper>
            <H4 component={'h1'}>Offene Rechnungen</H4>

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
                  Anderes Abo lösen
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
        <H4 component={'h1'}>Profil</H4>

        <PersonalDataFormContainer {...props} />

        <TotpSetupContainer />
      </ProfileWrapper>
    </>
  );
}

const GuardedProfile = withAuthGuard(ProfilePage) as NextPage<
  ComponentProps<typeof ProfilePage>
>;
GuardedProfile.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const { publicRuntimeConfig } = getConfig();
  const client = getApiClient(getApiUrl(), [
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
        query: NavigationListDocument,
      }),
      client.query({
        query: InvoicesDocument,
      }),
      client.query({
        query: SubscriptionsDocument,
      }),
    ]);
  }

  const props = addClientCacheToProps(client, sessionProps);

  return props;
};

export { GuardedProfile as ProfilePage };
