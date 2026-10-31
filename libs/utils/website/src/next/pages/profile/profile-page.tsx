import { PersonalDataFormContainer } from '@wepublish/user/website';
import {
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
import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { handleJwtLogin } from '../../handle-jwt-login';
import { withAuthGuard } from '../../auth-guard';
import { ssrAuthLink } from '../../../lib/auth-link';
import { getSessionTokenProps } from '../../get-session-token-props';

import { getApiUrl } from '../../../lib/api-url';
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

  return (
    <>
      {router.query.emailConfirmed && (
        <Alert severity="success">{t('user.emailChangeConfirmed')}</Alert>
      )}

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

  if (ctx.res?.headersSent) {
    return {};
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
