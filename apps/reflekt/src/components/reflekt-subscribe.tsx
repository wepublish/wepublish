import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { SubscribeBlock } from '@wepublish/block-content/website';
import {
  PaymentRadioWrapper,
  Subscribe,
  SubscribeButton,
  SubscribeCancelable,
  SubscribeExistingSubscriptionNotice,
  SubscribeNarrowSection,
  SubscribeOpenInvoicesNotice,
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
import { ComponentProps, useContext, useMemo } from 'react';

import { buttonLinkSecondaryStyles } from '../theme';
import { ForceUpgradeContext } from './reflekt-force-upgrade-context';
import { AllGoodiesContext } from './reflekt-goodie-picker';

export const ReflektSubscribeForm = styled(
  (props: ComponentProps<typeof Subscribe>) => {
    const allGoodies = useMemo(() => {
      const goodiesById = new Map(
        props.memberPlans.data?.memberPlans.nodes
          .flatMap(memberPlan => memberPlan.goodies ?? [])
          .map(goodie => [goodie.id, goodie])
      );

      return [...goodiesById.values()];
    }, [props.memberPlans.data?.memberPlans.nodes]);

    return (
      <AllGoodiesContext value={allGoodies}>
        <Subscribe {...props} />
      </AllGoodiesContext>
    );
  }
)`
  background-color: orange;
`;

const subscribeGridAreas = (
  showGoodies?: boolean,
  showDiscountCodes?: boolean,
  withNotices?: boolean,
  withError?: boolean,
  withChallenge?: boolean
) => `
    'memberPlans'
    'monthlyAmount'
    'userForm'
    ${showGoodies ? "'goodie' 'goodieError'" : ''}
    'transactionFee'
    ${showDiscountCodes ? "'discountCode'" : ''}
    ${withNotices ? "'notices'" : ''}
    ${withError ? "'error'" : ''}
    ${withChallenge ? "'challenge'" : ''}
    'submit'
    'paymentPeriodicity'
    ${showGoodies ? "'goodieSlider'" : ''}
  `;

export const StyledReflektSubscribeBlock = styled(SubscribeBlock)`
  background-color: transparent;
  grid-template-columns: 1fr;
  grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
    subscribeGridAreas(showGoodies, showDiscountCodes, false, false, false)};

  &:has([data-area='notices']:not(:empty)) {
    grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
      subscribeGridAreas(showGoodies, showDiscountCodes, true, false, false)};
  }

  &:has(> .MuiAlert-root) {
    grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
      subscribeGridAreas(showGoodies, showDiscountCodes, false, true, false)};
  }

  &:has([data-area='notices']:not(:empty)):has(> .MuiAlert-root) {
    grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
      subscribeGridAreas(showGoodies, showDiscountCodes, true, true, false)};
  }

  &:has([data-area='challenge']) {
    grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
      subscribeGridAreas(showGoodies, showDiscountCodes, false, false, true)};
  }

  &:has([data-area='challenge']):has(> .MuiAlert-root) {
    grid-template-areas: ${({ showGoodies, showDiscountCodes }) =>
      subscribeGridAreas(showGoodies, showDiscountCodes, false, true, true)};
  }

  & > .MuiAlert-root {
    grid-area: error;
  }

  ${SubscribeSection},
  ${SubscribeNarrowSection} {
    grid-area: var(--grid-area);

    > h2 {
      display: none;
    }
  }

  [data-area='returning'] {
    display: none;
  }

  [data-area='goodie'] {
    display: contents;

    > div {
      display: contents;
    }

    > div > .MuiFormHelperText-root {
      grid-area: goodieError;
    }
  }

  [data-area='paymentPeriodicity'] ${PaymentRadioWrapper} {
    outline: none;
    border: none;
  }

  [data-area='paymentPeriodicity'] ${SubscribePayment} {
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

  [data-area='challenge'] > div > div {
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

  ${SubscribeOpenInvoicesNotice} .MuiAlert-root,
  ${SubscribeExistingSubscriptionNotice} .MuiAlert-root {
    background-color: transparent;
    color: ${({ theme }) => theme.palette.text.secondary};
    padding: 0;
    font-size: 0.875rem;
    max-width: 30rem;
    text-align: center;
    margin: 0 auto;
  }

  ${SubscribeOpenInvoicesNotice} .MuiAlert-icon,
  ${SubscribeExistingSubscriptionNotice} .MuiAlert-icon {
    display: none;
  }

  ${SubscribeOpenInvoicesNotice} .MuiAlert-message,
  ${SubscribeExistingSubscriptionNotice} .MuiAlert-message {
    padding: 0;
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

  return <StyledReflektSubscribeBlock {...props} />;
};
