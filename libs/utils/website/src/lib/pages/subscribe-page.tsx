import { QueryOptions } from '@apollo/client';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ssrAuthLink } from '../auth-link';
import { getSessionTokenProps } from '../get-session-token-props';
import { handleJwtLogin } from '../handle-jwt-login';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import { MemberPlanListQueryVariables } from '@wepublish/website/api';
import { useUser } from '@wepublish/authentication/website';
import {
  SubscribeContainer,
  UpgradeContainer,
} from '@wepublish/membership/website';
import {
  getV1ApiClient,
  MemberPlanListDocument,
  NavigationListDocument,
  PeerProfileDocument,
  MeDocument,
  InvoicesDocument,
  addClientCacheToV1Props,
} from '@wepublish/website/api';
import { ComponentProps, useMemo } from 'react';

import { getApiUrl } from '../api-url';

type SubscribePageProps = Omit<ComponentProps<typeof SubscribeContainer>, ''>;

export function SubscribePage(props: SubscribePageProps) {
  const {
    query: {
      memberPlanBySlug,
      additionalMemberPlans,
      firstName,
      mail,
      lastName,
      deactivateSubscriptionId,
      upgradeSubscriptionId,
      userId,
    },
  } = useRouter();

  const { hasUser } = useUser();

  const userSubscriptions = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const subscriptionToUpgrade = useMemo(() => {
    return userSubscriptions.data?.userSubscriptions.find(
      subscription => subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.userSubscriptions]);

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
            ...props.defaults,
          }}
          filter={memberPlans => {
            const parentFiltered = props.filter?.(memberPlans) ?? memberPlans;

            const preselectedMemberPlan = parentFiltered.find(
              ({ slug }) => slug === memberPlanBySlug
            );

            if (additionalMemberPlans === 'upsell' && preselectedMemberPlan) {
              return parentFiltered.filter(
                memberPlan =>
                  memberPlan.amountPerMonthMin >=
                    preselectedMemberPlan.amountPerMonthMin ||
                  memberPlan === preselectedMemberPlan
              );
            }

            return preselectedMemberPlan && additionalMemberPlans !== 'all' ?
                [preselectedMemberPlan]
              : parentFiltered;
          }}
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
          filter={memberPlans => {
            const parentFiltered = props.filter?.(memberPlans) ?? memberPlans;

            const preselectedMemberPlan = parentFiltered.find(
              ({ slug }) => slug === memberPlanBySlug
            );

            if (additionalMemberPlans === 'upsell' && preselectedMemberPlan) {
              return parentFiltered.filter(
                memberPlan =>
                  memberPlan.amountPerMonthMin >=
                    preselectedMemberPlan.amountPerMonthMin ||
                  memberPlan === preselectedMemberPlan
              );
            }

            return preselectedMemberPlan && additionalMemberPlans !== 'all' ?
                [preselectedMemberPlan]
              : parentFiltered;
          }}
          upgradeSubscriptionId={upgradeSubscriptionId as string}
        />
      )}
    </>
  );
}

SubscribePage.getInitialProps = async (
  ctx: NextPageContext,
  extraQueries: QueryOptions<any, any>[] = []
) => {
  const { publicRuntimeConfig } = getConfig();
  const client = getV1ApiClient(getApiUrl(), [
    ssrAuthLink(
      async () => (await getSessionTokenProps(ctx)).sessionToken?.token
    ),
  ]);

  await handleJwtLogin(ctx, client, !!publicRuntimeConfig.env.HTTP_ONLY_COOKIE);

  const sessionProps = await getSessionTokenProps(ctx);

  const dataPromises = [
    client.query<MemberPlanListQueryVariables>({
      query: MemberPlanListDocument,
      variables: {
        take: 50,
        filter: {
          active: true,
        },
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
    ...extraQueries.map(options => client.query(options)),
  ];

  if (sessionProps.sessionToken) {
    dataPromises.push(
      ...[
        client.query({
          query: MeDocument,
        }),
        client.query({
          query: InvoicesDocument,
          variables: {
            take: 50,
          },
        }),
      ]
    );
  }

  await Promise.all(dataPromises);
  const props = addClientCacheToV1Props(client, sessionProps);

  return props;
};
