import { ApolloClient } from '@apollo/client';
import { createServerFn } from '@tanstack/react-start';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  SubscriptionsDocument,
  SubscriptionsQuery,
} from '@wepublish/website/api';

import { ProfileSubscription } from '../../lib/components/profile/profile-subscription';
import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
} from '../ssr';
import { withAuthGuard } from '../auth-guard';
import { useQueryParams } from '../router-hooks';

/**
 * What the subscription page renders, fetched on the server. The feature
 * flags decide between the edit page and the old card; the active member
 * plans are the edit page's upgrade options. A subscription counts as missing
 * only when the list loaded and does not have it.
 */
export const prefetchSubscription = async (client: ApolloClient, id: string) => {
  const [subscriptions] = await Promise.all([
    client.query<SubscriptionsQuery>({ query: SubscriptionsDocument }),
    client.query({ query: InvoicesDocument }),
    client.query({ query: MeDocument }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: FeaturesDocument }),
    client.query({
      query: MemberPlanListDocument,
      variables: { take: 50, filter: { active: true } },
    }),
  ]);

  return {
    subscriptionMissing:
      !subscriptions.error &&
      !subscriptions.data?.userSubscriptions.find(
        subscription => subscription.id === id
      ),
  };
};

/**
 * TanStack port of `SubscriptionPage.getInitialProps`.
 *
 * The Next version could not return `{ notFound: true }` from
 * `getInitialProps`, so it fetched and streamed the `/404` HTML by hand
 * (`fetch404`). Here the route simply throws `notFound()` when
 * `subscriptionMissing` comes back true — no second HTTP request, and the
 * response carries a real 404.
 */
export const loadSubscription = createServerFn({ method: 'GET' })
  .validator((data: { id: string; jwt?: string }) => data)
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
    const { subscriptionMissing } =
      sessionToken ?
        await prefetchSubscription(client, data.id)
      : { subscriptionMissing: false };

    return {
      sessionToken,
      subscriptionMissing,
      apollo: extractCache(client),
    };
  });

function SubscriptionPageComponent() {
  const { id } = useQueryParams();

  return <ProfileSubscription id={id as string} />;
}

export const SubscriptionPage = withAuthGuard(SubscriptionPageComponent);
