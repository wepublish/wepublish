import { useQuery } from '@apollo/client/react';
import { createServerFn } from '@tanstack/react-start';
import { useUser } from '@wepublish/authentication/website';
import {
  getMonthlyEquivalentRange,
  SubscribeContainer,
  UpgradeContainer,
} from '@wepublish/membership/website';
import {
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  MemberPlanListQueryVariables,
  NavigationListDocument,
  PeerProfileDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { ComponentProps, useMemo } from 'react';

import {
  createAuthenticatedSsrClient,
  extractCache,
  getRequestSessionToken,
  handleJwtLogin,
} from '../ssr';
import { useQueryParams } from '../router-hooks';

/** TanStack port of `SubscribePage.getInitialProps`. */
export const loadSubscribe = createServerFn({ method: 'GET' })
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

    const queries: Array<Promise<unknown>> = [
      client.query<MemberPlanListQueryVariables>({
        query: MemberPlanListDocument,
        variables: { take: 50, filter: { active: true } },
      }),
      client.query({ query: NavigationListDocument }),
      client.query({ query: PeerProfileDocument }),
    ];

    if (sessionToken) {
      queries.push(
        client.query({ query: MeDocument }),
        client.query({ query: InvoicesDocument })
      );
    }

    await Promise.all(queries);

    return { sessionToken, apollo: extractCache(client) };
  });

type SubscribePageProps = Omit<ComponentProps<typeof SubscribeContainer>, ''>;

/** TanStack port of `SubscribePage`. */
export function SubscribePage(props: SubscribePageProps) {
  const {
    memberPlanBySlug,
    additionalMemberPlans,
    firstName,
    mail,
    lastName,
    deactivateSubscriptionId,
    upgradeSubscriptionId,
    userId,
    discountCode,
  } = useQueryParams();

  const { hasUser } = useUser();

  const userSubscriptions = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const subscriptionToUpgrade = useMemo(
    () =>
      userSubscriptions.data?.userSubscriptions.find(
        subscription => subscription.id === upgradeSubscriptionId
      ),
    [upgradeSubscriptionId, userSubscriptions.data?.userSubscriptions]
  );

  const filterMemberPlans = (
    memberPlans: Parameters<NonNullable<SubscribePageProps['filter']>>[0]
  ) => {
    const parentFiltered = props.filter?.(memberPlans) ?? memberPlans;

    const preselectedMemberPlan = parentFiltered.find(
      ({ slug }) => slug === memberPlanBySlug
    );

    if (additionalMemberPlans === 'upsell' && preselectedMemberPlan) {
      return parentFiltered.filter(
        memberPlan =>
          getMonthlyEquivalentRange(memberPlan).amountPerMonthMin >=
            getMonthlyEquivalentRange(preselectedMemberPlan)
              .amountPerMonthMin || memberPlan === preselectedMemberPlan
      );
    }

    return preselectedMemberPlan && additionalMemberPlans !== 'all' ?
        [preselectedMemberPlan]
      : parentFiltered;
  };

  return (
    <>
      {!subscriptionToUpgrade && (
        <SubscribeContainer
          {...props}
          defaults={{
            email: mail as string | undefined,
            firstName: firstName as string | undefined,
            name: lastName as string | undefined,
            memberPlanSlug: memberPlanBySlug as string | undefined,
            discountCode: discountCode as string | undefined,
            ...props.defaults,
          }}
          filter={filterMemberPlans}
          deactivateSubscriptionId={
            props.deactivateSubscriptionId ??
            (deactivateSubscriptionId as string | undefined)
          }
          returningUserId={userId as string | undefined}
        />
      )}

      {subscriptionToUpgrade && (
        <UpgradeContainer
          {...props}
          defaults={{
            memberPlanSlug: memberPlanBySlug as string | undefined,
          }}
          filter={filterMemberPlans}
          upgradeSubscriptionId={upgradeSubscriptionId as string}
        />
      )}
    </>
  );
}
