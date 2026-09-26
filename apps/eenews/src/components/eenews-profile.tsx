import { useApolloClient } from '@apollo/client';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import {
  PersonalDataFormContainer,
  TotpSetupContainer,
} from '@wepublish/user/website';
import {
  useConfirmEmailChangeMutation,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { OpenInvoicesCard } from './eenews-open-invoices';
import {
  ProfileCard,
  ProfileCardBody,
  ProfileCardHead,
  ProfileCardTitle,
} from './eenews-profile-card';

const Page = styled('div')`
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: 24px;
`;

const HeadAction = styled(Link)`
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const DeactivatedLink = styled('div')`
  padding-top: 16px;
  & a {
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;

const FormStack = styled('div')`
  display: grid;
  gap: 32px;
`;

export const EenewsProfile = () => {
  const {
    elements: { Alert },
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
  }, [router.query.confirmEmailChange, confirmEmailChange, router, client]);

  const { data: subscriptionData } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
  });
  const hasActiveSubscriptions = subscriptionData?.userSubscriptions.some(
    subscription => !subscription.deactivation
  );
  const hasDeactivatedSubscriptions = subscriptionData?.userSubscriptions.some(
    subscription => subscription.deactivation
  );

  return (
    <Page>
      {confirmData && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}
      {confirmError && <Alert severity="error">{confirmError.message}</Alert>}

      <OpenInvoicesCard />

      <ProfileCard>
        <ProfileCardHead>
          <ProfileCardTitle variant="articleH2">
            Aktive Abos &amp; Spenden
          </ProfileCardTitle>
          {hasActiveSubscriptions && (
            <HeadAction href="/mitmachen">
              <Typography
                variant="pageCrumb"
                component="span"
              >
                + Anderes Abo lösen
              </Typography>
            </HeadAction>
          )}
        </ProfileCardHead>
        <ProfileCardBody tight>
          <SubscriptionListContainer
            filter={subscriptions =>
              subscriptions.filter(subscription => !subscription.deactivation)
            }
          />
          {hasDeactivatedSubscriptions && (
            <DeactivatedLink>
              <Link href="/profile/subscription/deactivated">
                {t('user.viewCancelledSubscriptions')}
              </Link>
            </DeactivatedLink>
          )}
        </ProfileCardBody>
      </ProfileCard>

      <ProfileCard>
        <ProfileCardHead>
          <ProfileCardTitle variant="articleH2">
            Persönliche Daten &amp; Konto
          </ProfileCardTitle>
        </ProfileCardHead>
        <ProfileCardBody>
          <FormStack>
            <PersonalDataFormContainer />
            <TotpSetupContainer />
          </FormStack>
        </ProfileCardBody>
      </ProfileCard>
    </Page>
  );
};
