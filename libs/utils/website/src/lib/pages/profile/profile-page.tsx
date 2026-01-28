import styled from '@emotion/styled';
import { css } from '@mui/material';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { ContentWrapper } from '@wepublish/content/website';
import {
  InvoiceListContainer,
  InvoiceListItemWrapper,
  SubscriptionListContainer,
  SubscriptionListItemContent,
  SubscriptionListItemWrapper,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import { PersonalDataFormContainer } from '@wepublish/user/website';
import {
  addClientCacheToV1Props,
  getV1ApiClient,
  LoginWithJwtDocument,
  MeDocument,
  NavigationListDocument,
  InvoicesDocument,
  SubscriptionsDocument,
  ProductType,
  SessionWithTokenWithoutUser,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { Button, Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { setCookie } from 'cookies-next';
import { NextPage, NextPageContext } from 'next';
import getConfig from 'next/config';
import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';

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
    elements: { H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const { data: subscriptonData } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
  });

  const hasDeactivatedSubscriptions = subscriptonData?.subscriptions.some(
    subscription => subscription.deactivation
  );
  const hasActiveSubscriptions = subscriptonData?.subscriptions.some(
    subscription =>
      !subscription.deactivation &&
      subscription.memberPlan.productType === ProductType.Subscription
  );
  const hasActiveDonations = subscriptonData?.subscriptions.some(
    subscription =>
      !subscription.deactivation &&
      subscription.memberPlan.productType === ProductType.Donation
  );

  const hasUnpaidInvoices = useHasUnpaidInvoices();

  return (
    <>
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
                  Anderes Abo lösen.
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

  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};

export { GuardedProfile as ProfilePage };
