import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { SubscribeBlock } from '@wepublish/block-content/website';
import { SubscribeButton } from '@wepublish/membership/website';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { ascend, descend, prop, sortWith } from 'ramda';
import { useContext, useMemo } from 'react';

import {
  isMemberplanUpgradeableTo,
  isSubscriptionUpgradeable,
} from '../hooks/inform-user-upgrade';
import { ForceUpgradeContext } from './hauptstadt-page';

const StyledSubscribeBlock = styled(SubscribeBlock)`
  ${SubscribeButton} {
    font-weight: 500;
  }
`;

export const HauptstadtSubscribe = (props: BuilderSubscribeBlockProps) => {
  const { hasUser } = useUser();
  const router = useRouter();
  const forceUpgrade = useContext(ForceUpgradeContext);

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
      sortWith(
        [
          descend(prop('monthlyAmount')),
          ascend(sub => Number(!!sub.deactivation)),
        ],
        filteredSubscriptions
      ).at(0),
    [filteredSubscriptions]
  );

  const canUpgrade = !!upgradeableTo.length && cheapestSubscription;

  if (canUpgrade && !router.query.upgradeSubscriptionId && forceUpgrade) {
    router.replace({
      query: {
        ...router.query,
        upgradeSubscriptionId: encodeURIComponent(cheapestSubscription.id),
      },
      pathname: router.pathname,
    });
  }

  return <StyledSubscribeBlock {...props} />;
};
