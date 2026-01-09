import { useUser } from '@wepublish/authentication/website';
import { SubscribeBlock } from '@wepublish/block-content/website';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { ascend, prop, sortWith } from 'ramda';
import { useMemo } from 'react';

import {
  isMemberplanUpgradeableTo,
  isSubscriptionUpgradeable,
} from '../hooks/inform-user-upgrade';

export const HauptstadtSubscribe = (props: BuilderSubscribeBlockProps) => {
  const { hasUser } = useUser();
  const router = useRouter();

  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const filteredSubscriptions = useMemo(
    () => data?.subscriptions.filter(isSubscriptionUpgradeable) ?? [],
    [data?.subscriptions]
  );

  const upgradeableTo = useMemo(
    () =>
      props.memberPlans.filter(
        mb =>
          isMemberplanUpgradeableTo(mb) &&
          filteredSubscriptions.every(sub => sub.memberPlan.id !== mb.id) &&
          filteredSubscriptions.some(
            sub => mb.amountPerMonthMin > sub.memberPlan.amountPerMonthMin
          )
      ),
    [filteredSubscriptions, props.memberPlans]
  );

  const cheapestSubscription = useMemo(
    () =>
      sortWith([ascend(prop('monthlyAmount'))], filteredSubscriptions).at(0),
    [filteredSubscriptions]
  );

  const canUpgrade = !!upgradeableTo.length && cheapestSubscription;

  if (canUpgrade && !router.query.upgradeSubscriptionId) {
    router.replace(
      `?upgradeSubscriptionId=${encodeURIComponent(cheapestSubscription.id)}`
    );
  }

  return <SubscribeBlock {...props} />;
};
