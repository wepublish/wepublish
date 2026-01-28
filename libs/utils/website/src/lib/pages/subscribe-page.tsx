import { setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ssrAuthLink } from '../auth-link';
import { getSessionTokenProps } from '../get-session-token-props';
import {
  SessionWithTokenWithoutUser,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { MemberPlanListQueryVariables } from '@wepublish/website/api';
import {
  AuthTokenStorageKey,
  useUser,
} from '@wepublish/authentication/website';
import {
  SubscribeContainer,
  UpgradeContainer,
} from '@wepublish/membership/website';
import {
  getV1ApiClient,
  LoginWithJwtDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  PeerProfileDocument,
  MeDocument,
  InvoicesDocument,
  addClientCacheToV1Props,
} from '@wepublish/website/api';
import { ComponentProps, useMemo } from 'react';

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
    return userSubscriptions.data?.subscriptions.find(
      subscription => subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.subscriptions]);

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

SubscribePage.getInitialProps = async (ctx: NextPageContext) => {
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
