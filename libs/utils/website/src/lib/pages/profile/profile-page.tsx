import { useMutation } from '@apollo/client/react';
import { useApolloClient } from '@apollo/client/react';
import { PersonalDataFormContainer } from '@wepublish/user/website';
import {
  ConfirmEmailChangeDocument,
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { ComponentProps, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { handleJwtLogin } from '../../handle-jwt-login';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';

import { getApiUrl } from '../../api-url';
import { ProfileDetails } from './profile-details';
import { ProfileSubscriptions } from './profile-subscriptions';

type ProfilePageProps = Omit<
  ComponentProps<typeof PersonalDataFormContainer>,
  ''
> & { className?: string };

function ProfilePage({ className, ...props }: ProfilePageProps) {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const [confirmEmailChange, { data: confirmData, error: confirmError }] =
    useMutation(ConfirmEmailChangeDocument);

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

  return (
    <>
      {confirmData && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}

      {confirmError && <Alert severity="error">{confirmError.message}</Alert>}

      <ProfileSubscriptions className={className} />

      <ProfileDetails
        className={className}
        {...props}
      />
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

  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, !!process.env.HTTP_ONLY_COOKIE);

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
      // tells ProfileSubscriptions which layout this medium has
      client.query({
        query: FeaturesDocument,
      }),
    ]);
  }

  const props = addClientCacheToProps(client, sessionProps);

  return props;
};

export { GuardedProfile as ProfilePage };
