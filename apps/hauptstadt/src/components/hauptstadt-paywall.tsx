import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import { Paywall, useShowPaywall } from '@wepublish/paywall/website';
import { createWithTheme } from '@wepublish/ui';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import {
  BuilderPaywallProps,
  Paywall as BuilderPaywall,
} from '@wepublish/website/builder';
import { ascend, prop, sortWith } from 'ramda';
import { useMemo } from 'react';

import theme from '../theme';

const StyledPaywall = styled(Paywall)`
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

export const HauptstadtPaywall = createWithTheme(
  (props: BuilderPaywallProps) => {
    const { hasUser } = useUser();
    const url = props.alternativeSubscribeUrl ?? '/mitmachen';

    const { data } = useSubscriptionsQuery({
      skip: !hasUser,
    });

    const hasRequiredSubscription =
      props.anyMemberPlan ||
      data?.subscriptions.some(subscription =>
        props.memberPlans.find(mb => subscription.memberPlan.id === mb.id)
      );
    const cheapestSubscription = useMemo(() => {
      if (hasRequiredSubscription) {
        return;
      }

      return sortWith(
        [ascend(prop('monthlyAmount'))],
        data?.subscriptions ?? []
      ).at(0);
    }, [data?.subscriptions, hasRequiredSubscription]);

    return (
      <StyledPaywall
        {...props}
        alternativeSubscribeUrl={
          cheapestSubscription ? `${url}?id=${cheapestSubscription.id}` : url
        }
      />
    );
  },
  theme
);

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
