import { useUser } from '@wepublish/authentication/website';
import { getMonthlyEquivalentRange } from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  ProductType,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { useRouter } from 'next/router';
import { ascend, prop, sortWith } from 'ramda';
import { useContext, useEffect, useMemo } from 'react';

import { ForceUpgradeContext } from '../reflekt-force-upgrade-context';

const isMemberplanUpgradeable = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription;

const isMemberplanUpgradeableTo = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription && memberPlan.extendable;

const isDeactivationInFuture = (subscription: FullSubscriptionFragment) =>
  !subscription.deactivation ||
  new Date(subscription.deactivation.date) > new Date();

const isSubscriptionUpgradeable = (subscription: FullSubscriptionFragment) =>
  subscription.extendable &&
  subscription.isActive &&
  isDeactivationInFuture(subscription) &&
  isMemberplanUpgradeable(subscription.memberPlan);

export const useForceUpgradeRedirect = (
  memberPlans: FullMemberPlanFragment[]
) => {
  const { hasUser } = useUser();
  const router = useRouter();
  const forceUpgrade = useContext(ForceUpgradeContext);

  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const upgradeableSubscriptions = useMemo(
    () => data?.userSubscriptions.filter(isSubscriptionUpgradeable) ?? [],
    [data?.userSubscriptions]
  );

  const subscriptionToUpgrade = useMemo(() => {
    const subscribedPlanIds = new Set(
      upgradeableSubscriptions.map(sub => sub.memberPlan.id)
    );

    const hasUpgradeTarget = (subscription: FullSubscriptionFragment) =>
      memberPlans.some(
        memberPlan =>
          isMemberplanUpgradeableTo(memberPlan) &&
          !subscribedPlanIds.has(memberPlan.id) &&
          getMonthlyEquivalentRange(memberPlan).amountPerMonthMin >
            getMonthlyEquivalentRange(subscription.memberPlan).amountPerMonthMin
      );

    return sortWith(
      [
        ascend(prop('monthlyAmount')),
        ascend((sub: FullSubscriptionFragment) => Number(!!sub.deactivation)),
      ],
      upgradeableSubscriptions.filter(hasUpgradeTarget)
    ).at(0);
  }, [upgradeableSubscriptions, memberPlans]);

  const shouldRedirect =
    forceUpgrade &&
    !!subscriptionToUpgrade &&
    !router.query.upgradeSubscriptionId;

  useEffect(() => {
    if (!shouldRedirect || !subscriptionToUpgrade) {
      return;
    }

    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        upgradeSubscriptionId: encodeURIComponent(subscriptionToUpgrade.id),
      },
    });
  }, [shouldRedirect, subscriptionToUpgrade, router]);
};
