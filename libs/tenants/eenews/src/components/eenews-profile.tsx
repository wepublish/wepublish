import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { SubscriptionListContainer } from '@wepublish/membership/website';
import {
  PersonalDataFormContainer,
  TotpSetupContainer,
} from '@wepublish/user/website';
import { SubscriptionsDocument } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
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
  const { data: subscriptionData } = useQuery(SubscriptionsDocument, {
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
      {router.query.emailConfirmed && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}

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
