import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { getMonthlyEquivalentRange } from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  ProductType,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { BuilderRouterContext } from '@wepublish/website/builder';
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
  const { query, asPath, navigate } = useContext(BuilderRouterContext);
  const forceUpgrade = useContext(ForceUpgradeContext);

  const { data } = useQuery(SubscriptionsDocument, {
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
    forceUpgrade && !!subscriptionToUpgrade && !query.upgradeSubscriptionId;

  useEffect(() => {
    if (!shouldRedirect || !subscriptionToUpgrade) {
      return;
    }

    const url = new URL(asPath, 'http://localhost');
    url.searchParams.set('upgradeSubscriptionId', subscriptionToUpgrade.id);

    void navigate?.(`${url.pathname}${url.search}`, { replace: true });
  }, [shouldRedirect, subscriptionToUpgrade, asPath, navigate]);
};
