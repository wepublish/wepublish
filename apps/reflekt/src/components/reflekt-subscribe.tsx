import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { SubscribeBlock } from '@wepublish/block-content/website';
import {
  GoodieSection,
  PaymentRadioWrapper,
  Subscribe,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeNarrowSection,
  SubscribePayment,
  SubscribeSection,
  TransactionFeeIcon,
  TransactionFeeWrapper,
} from '@wepublish/membership/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  ProductType,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { ascend, descend, prop, sortWith } from 'ramda';
import { useContext, useMemo } from 'react';

import { buttonLinkSecondaryStyles } from '../theme';
import { ForceUpgradeContext } from './reflekt-force-upgrade-context';

export const ReflektSubscribeForm = styled(Subscribe)`
  background-color: orange;
`;
export const ReflektSubscribe = styled(SubscribeBlock)`
  background-color: transparent;
  grid-template-columns: 1fr;
  grid-template-areas:
    'memberPlans'
    'monthlyAmount'
    ${({ showGoodies }) => (showGoodies ? "'goodieSlider'" : '')}
    'userForm'
    ${({ showGoodies }) => (showGoodies ? "'goodie' 'goodieError'" : '')}
    'transactionFee'
    ${({ showVouchers }) => (showVouchers ? "'voucher'" : '')}
    'submit'
    'paymentPeriodicity'
    'challenge';

  ${SubscribeSection},
  ${SubscribeNarrowSection},
  ${GoodieSection} {
    grid-area: var(--grid-area);

    > h2 {
      display: none;
    }
  }

  ${SubscribeSection}[data-area='returning'] {
    display: none;
  }

  ${GoodieSection} {
    display: contents;

    > div {
      display: contents;
    }

    > div > .MuiFormHelperText-root {
      grid-area: goodieError;
    }
  }

  ${SubscribeSection}[data-area='paymentPeriodicity'] ${PaymentRadioWrapper} {
    outline: none;
    border: none;
  }

  ${SubscribeSection}[data-area='paymentPeriodicity'] ${SubscribePayment} {
    justify-content: center;
  }

  ${SubscribeButton} {
    ${css(buttonLinkSecondaryStyles)}
  }

  ${TransactionFeeWrapper} {
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    border-radius: 0;
    padding: ${({ theme }) => theme.spacing(1, 2)};
    border: none;
    width: 100%;
    justify-content: center;

    ${TransactionFeeIcon} {
      display: none;
    }

    .MuiCheckbox-root,
    .MuiCheckbox-root.Mui-checked {
      color: ${({ theme }) => theme.palette.common.white};
    }
  }

  ${SubscribeSection}[data-area='challenge'] > div > div {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  ${ReflektSubscribeForm} {
    background-color: transparent;
  }

  ${SubscribeCancelable} {
    margin-top: ${({ theme }) => theme.spacing(2)};
    white-space: pre-line;
    color: ${({ theme }) => theme.palette.common.black};
  }
`;

const isMemberplanUpgradeable = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription;

const isMemberplanUpgradeableTo = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.productType === ProductType.Subscription && memberPlan.extendable;

const isSubscriptionUpgradeable = (subscription: FullSubscriptionFragment) =>
  subscription.extendable &&
  subscription.isActive &&
  // isActive includes the grace period, which we want to ignore here
  (!subscription.deactivation ||
    new Date(subscription.deactivation.date) > new Date()) &&
  isMemberplanUpgradeable(subscription.memberPlan);

/**
 * Subscribe block used for regular subscribe pages. On a page tagged for
 * force-upgrade (ForceUpgradeContext), it rewrites the URL to
 * `?upgradeSubscriptionId=<cheapest upgradeable subscription>` so the core
 * SubscribeBlock renders the Upgrade flow. Otherwise it behaves like the plain
 * ReflektSubscribe block.
 */
export const ReflektSubscribeBlock = (props: BuilderSubscribeBlockProps) => {
  const { hasUser } = useUser();
  const router = useRouter();
  const forceUpgrade = useContext(ForceUpgradeContext);

  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const filteredSubscriptions = useMemo(
    () => data?.userSubscriptions.filter(isSubscriptionUpgradeable) ?? [],
    [data?.userSubscriptions]
  );

  const canUpgradeTo = useMemo(
    () =>
      props.memberPlans.some(
        memberPlan =>
          isMemberplanUpgradeableTo(memberPlan) &&
          filteredSubscriptions.every(
            sub => sub.memberPlan.id !== memberPlan.id
          ) &&
          filteredSubscriptions.some(
            sub =>
              memberPlan.amountPerMonthMin > sub.memberPlan.amountPerMonthMin
          )
      ),
    [filteredSubscriptions, props.memberPlans]
  );

  const cheapestSubscription = useMemo(
    () =>
      sortWith(
        [
          descend(prop('monthlyAmount')),
          ascend((sub: FullSubscriptionFragment) => Number(!!sub.deactivation)),
        ],
        filteredSubscriptions
      ).at(0),
    [filteredSubscriptions]
  );

  if (
    forceUpgrade &&
    canUpgradeTo &&
    cheapestSubscription &&
    !router.query.upgradeSubscriptionId
  ) {
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        upgradeSubscriptionId: encodeURIComponent(cheapestSubscription.id),
      },
    });
  }

  return <ReflektSubscribe {...props} />;
};
