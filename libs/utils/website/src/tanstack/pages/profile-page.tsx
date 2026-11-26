import { ApolloClient } from '@apollo/client';
import { createServerFn } from '@tanstack/react-start';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

import {
  ProfileDetails,
  ProfileDetailsProps,
} from '../../lib/components/profile/profile-details';
import { ProfileSubscriptions } from '../../lib/components/profile/profile-subscriptions';
import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
  withAcceptedSession,
} from '../ssr';
import { withAuthGuard } from '../auth-guard';
import { useQueryParams } from '../router-hooks';

/**
 * What the profile renders, fetched on the server. The feature flags decide
 * between the subscription history and the old cards: without them the server
 * renders the old layout.
 */
export const prefetchProfile = (client: ApolloClient) =>
  Promise.all([
    client.query({ query: MeDocument }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: InvoicesDocument }),
    client.query({ query: SubscriptionsDocument }),
    client.query({ query: FeaturesDocument }),
  ]);

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
      await prefetchProfile(client);
    }

    return {
      sessionToken: withAcceptedSession(client, sessionToken),
      apollo: extractCache(client),
    };
  });

type ProfilePageProps = ProfileDetailsProps & { className?: string };

function ProfilePageComponent({ className, ...props }: ProfilePageProps) {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  // The confirm-email page confirms the token from the confirmation link and
  // sends the reader here once the new address is in place.
  const query = useQueryParams();

  return (
    <>
      {query.emailConfirmed && (
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

export const ProfilePage = withAuthGuard(ProfilePageComponent);
