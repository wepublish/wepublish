import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { Paywall, useShowPaywall } from '@wepublish/paywall/website';
import { createWithTheme } from '@wepublish/ui';
import { ProductType, useSubscriptionsQuery } from '@wepublish/website/api';
import {
  BuilderPaywallProps,
  Paywall as BuilderPaywall,
} from '@wepublish/website/builder';
import { ascend, prop, sortWith } from 'ramda';
import { useMemo } from 'react';

import theme from '../theme';

const HauptstadtPaywall = styled((props: BuilderPaywallProps) => {
  const { hasUser } = useUser();
  const url = props.alternativeSubscribeUrl ?? '/mitmachen';

  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-only',
    skip: !hasUser,
  });

  const hasRequiredSubscription = useMemo(
    () =>
      props.anyMemberPlan ||
      data?.subscriptions.some(
        subscription =>
          props.memberPlans.find(mb => subscription.memberPlan.id === mb.id) &&
          subscription.extendable &&
          subscription.autoRenew &&
          subscription.isActive &&
          subscription.memberPlan.productType === ProductType.Subscription
      ),
    [data?.subscriptions, props.anyMemberPlan, props.memberPlans]
  );

  const cheapestSubscription = useMemo(
    () =>
      sortWith([ascend(prop('monthlyAmount'))], data?.subscriptions ?? []).at(
        0
      ),
    [data?.subscriptions]
  );

  const canUpgrade = !hasRequiredSubscription && cheapestSubscription;

  return (
    <Paywall
      {...props}
      alternativeSubscribeUrl={
        canUpgrade ?
          `${url}?upgradeSubscriptionId=${encodeURIComponent(cheapestSubscription.id)}`
        : url
      }
      texts={{
        subscribe: canUpgrade ? 'Jetzt Abo Upgraden' : undefined,
      }}
      description={
        canUpgrade ?
          (props.upgradeDescription ?? props.description)
        : props.description
      }
      circumventDescription={
        canUpgrade ?
          (props.upgradeCircumventDescription ?? props.circumventDescription)
        : props.circumventDescription
      }
    />
  );
})`
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

const ThemedPaywall = createWithTheme(HauptstadtPaywall, theme);
export { ThemedPaywall as HauptstadtPaywall };

export const DuplicatedPaywall = ({
  paywall,
}: {
  paywall: Parameters<typeof useShowPaywall>[0];
}) => {
  const { showPaywall, hideContent } = useShowPaywall(paywall);

  if (showPaywall && !hideContent) {
    return (
      <BuilderPaywall
        {...paywall!}
        hideContent={hideContent}
        css={{
          gridRowStart: 5, // After 3rd block
        }}
      />
    );
  }

  return null;
};
