import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { withAuthGuard } from '../../../auth-guard';
import { ssrAuthLink } from '../../../../lib/auth-link';
import { getSessionTokenProps } from '../../../get-session-token-props';
import { handleJwtLogin } from '../../../handle-jwt-login';
import { ComponentProps } from 'react';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  SubscriptionsDocument,
  SubscriptionsQuery,
  addClientCacheToProps,
  getApiClient,
} from '@wepublish/website/api';
import { fetch404 } from '../../../fetch-404';

import { getApiUrl } from '../../../../lib/api-url';
import { ProfileSubscription } from '../../../../lib/components/profile/profile-subscription';

function SubscriptionPage() {
  const {
    query: { id },
  } = useRouter();

  return <ProfileSubscription id={id as string} />;
}

const GuardedSubscription = withAuthGuard(SubscriptionPage) as NextPage<
  ComponentProps<typeof SubscriptionPage>
>;
GuardedSubscription.getInitialProps = async (ctx: NextPageContext) => {
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
    const [subscriptions] = await Promise.all([
      client.query<SubscriptionsQuery>({
        query: SubscriptionsDocument,
      }),
      client.query({
        query: InvoicesDocument,
      }),
      client.query({
        query: MeDocument,
      }),
      client.query({
        query: NavigationListDocument,
      }),
      // tells ProfileSubscription which layout this medium has
      client.query({
        query: FeaturesDocument,
      }),
      // for the edit page's upgrade
      client.query({
        query: MemberPlanListDocument,
        variables: { take: 50, filter: { active: true } },
      }),
    ]);

    if (
      !subscriptions.error &&
      !subscriptions.data?.userSubscriptions.find(
        subscription => subscription.id === ctx.query.id
      )
    ) {
      // {notFound: true} is not supported in getInitialProps
      await fetch404(ctx);
      return {};
    }
  }

  const props = addClientCacheToProps(client, sessionProps);

  return props;
};

export { GuardedSubscription as SubscriptionPage };
