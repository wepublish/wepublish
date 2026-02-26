import { useUser } from '@wepublish/authentication/website';
import { PaymentForm, useUpgrade } from '@wepublish/payment/website';
import {
  FullMemberPlanFragment,
  useMemberPlanListQuery,
  useSubscriptionsQuery,
  useUpgradeSubscriptionInfoLazyQuery,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderUpgradeProps,
  Upgrade,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { sortBy } from 'ramda';
import { useCallback, useMemo } from 'react';

export type UpgradeContainerProps = BuilderContainerProps &
  Pick<
    BuilderUpgradeProps,
    | 'defaults'
    | 'termsOfServiceUrl'
    | 'donate'
    | 'transactionFee'
    | 'transactionFeeText'
  > & {
    sort?: (memberPlans: FullMemberPlanFragment[]) => FullMemberPlanFragment[];
    filter?: (
      memberPlans: FullMemberPlanFragment[]
    ) => FullMemberPlanFragment[];
    upgradeSubscriptionId: string;
  };

export const UpgradeContainer = ({
  filter = memberPlan => memberPlan,
  sort = sortBy(memberPlan => memberPlan.amountPerMonthMin),
  upgradeSubscriptionId,
  ...props
}: UpgradeContainerProps) => {
  const { hasUser } = useUser();

  const [upgrade, redirectPages, stripeClientSecret] = useUpgrade();
  const [fetchUpgradeInfo, upgradeInfo] = useUpgradeSubscriptionInfoLazyQuery({
    fetchPolicy: 'cache-first',
  });

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });

  const userSubscriptions = useSubscriptionsQuery({
    skip: !hasUser,
  });

  const subscriptionToUpgrade = useMemo(() => {
    return userSubscriptions.data?.userSubscriptions.find(
      subscription => subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.userSubscriptions]);

  const handleOnSelect = useCallback(
    (memberPlanId: string | undefined) => {
      if (memberPlanId) {
        fetchUpgradeInfo({
          variables: {
            memberPlanId,
            subscriptionId: upgradeSubscriptionId as string,
          },
        });
      }
    },
    [fetchUpgradeInfo, upgradeSubscriptionId]
  );

  const filteredMemberPlans = useMemo(() => {
    return produce(memberPlanList, draftList => {
      if (draftList.data?.memberPlans) {
        draftList.data.memberPlans.nodes = filter(
          sort(draftList.data.memberPlans.nodes)
        );
      }
    });
  }, [memberPlanList, filter, sort]);

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      {subscriptionToUpgrade && (
        <Upgrade
          {...props}
          subscriptionToUpgrade={subscriptionToUpgrade}
          memberPlans={filteredMemberPlans}
          upgradeInfo={upgradeInfo}
          onSelect={handleOnSelect}
          onUpgrade={async formData => {
            const selectedMemberplan =
              filteredMemberPlans.data?.memberPlans.nodes.find(
                mb => mb.id === formData.memberPlanId
              );

            const result = await upgrade(selectedMemberplan, {
              variables: {
                ...formData,
              },
            });

            if (result.errors) {
              throw result.errors;
            }
          }}
        />
      )}
    </>
  );
};
