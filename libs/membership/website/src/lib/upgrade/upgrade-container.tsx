import { useUser } from '@wepublish/authentication/website';
import { PaymentForm, useUpgrade } from '@wepublish/payment/website';
import {
  FullMemberPlanFragment,
  useMemberPlanListQuery,
  useSubscriptionsQuery,
  useUpgradeSubscriptionInfoQuery,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderUpgradeProps,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { sortBy } from 'ramda';
import { useMemo, useState } from 'react';
import { Upgrade } from './upgrade';

export type UpgradeContainerProps = BuilderContainerProps &
  Pick<
    BuilderUpgradeProps,
    | 'defaults'
    | 'termsOfServiceUrl'
    | 'donate'
    | 'transactionFee'
    | 'transactionFeeText'
    | 'hidePaymentAmount'
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
  const [selectedMemberplanId, setSelectedMemberplanId] = useState<string>();
  const { hasUser } = useUser();

  const upgradeInfo = useUpgradeSubscriptionInfoQuery({
    skip: !hasUser || !upgradeSubscriptionId || !selectedMemberplanId,
    variables: {
      memberPlanId: selectedMemberplanId!,
      subscriptionId: upgradeSubscriptionId,
    },
  });

  const userSubscriptions = useSubscriptionsQuery({
    skip: !hasUser,
  });

  const subscriptionToUpgrade = useMemo(() => {
    return userSubscriptions.data?.subscriptions.find(
      subscription => subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.subscriptions]);

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });

  const [upgrade, redirectPages, stripeClientSecret] = useUpgrade();

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
          setSelectedMemberplan={setSelectedMemberplanId}
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
