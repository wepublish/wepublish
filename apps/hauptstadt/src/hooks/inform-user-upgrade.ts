import { useUser } from '@wepublish/authentication/website';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  ProductType,
  useMemberPlanListQuery,
} from '@wepublish/website/api';
import { allPass } from 'ramda';
import { useMemo } from 'react';

export const isMemberplanUpgradeableTo = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription && memberPlan.extendable;

export const isMemberplanUpgradeable = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription;

export const isSubscriptionUpgradeable = (
  subscription: FullSubscriptionFragment
) =>
  subscription.extendable &&
  subscription.isActive &&
  // isActive includes grace period which we want to ignore here
  (!subscription.deactivation ||
    new Date(subscription.deactivation.date) > new Date()) &&
  isMemberplanUpgradeable(subscription.memberPlan);

export const useInformUserAboutUpgrade = () => {
  const { hasUser } = useUser();
  const userSubscriptions = useActiveSubscriptions();
  const { data: memberPlanList } = useMemberPlanListQuery({
    skip: !hasUser,
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });

  const memberPlanToUpgradeTo = useMemo(() => {
    if (!userSubscriptions?.length) {
      return undefined;
    }

    return memberPlanList?.memberPlans.nodes.find(
      mb =>
        mb.tags?.includes('navbar-upgrade') &&
        isMemberplanUpgradeableTo(mb) &&
        userSubscriptions?.some(
          allPass([
            isSubscriptionUpgradeable,
            (sub: FullSubscriptionFragment) => mb.id !== sub.memberPlan.id,
            (sub: FullSubscriptionFragment) =>
              mb.amountPerMonthMin > sub.memberPlan.amountPerMonthMin,
          ])
        )
    );
  }, [memberPlanList?.memberPlans.nodes, userSubscriptions]);

  return [!!memberPlanToUpgradeTo, memberPlanToUpgradeTo];
};
