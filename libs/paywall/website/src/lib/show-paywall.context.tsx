import { FullPaywallFragment } from '@wepublish/website/api';
import { createContext, useContext, useMemo } from 'react';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import { useUser } from '@wepublish/authentication/website';
import { hasValidBypass } from './paywall-bypass';
import { CanGetArticle } from '@wepublish/permissions';

export const ShowPaywallContext = createContext<{
  showPaywall?: boolean;
  hideContent?: boolean;
}>({});

export const useShowPaywall = (
  paywall?: FullPaywallFragment | null
): { showPaywall: boolean; hideContent: boolean } => {
  const subscriptions = useActiveSubscriptions();
  const { user } = useUser();
  const ctx = useContext(ShowPaywallContext);

  return useMemo(() => {
    const memberPlanIds = subscriptions?.map(s => s.memberPlan.id) ?? [];

    if (!paywall || !paywall.active) {
      return { hideContent: false, showPaywall: false };
    }

    if (user?.permissions.includes(CanGetArticle.id)) {
      return { hideContent: false, showPaywall: false };
    }

    if (paywall.anyMemberPlan && subscriptions?.length) {
      return { showPaywall: false, hideContent: false };
    }

    const validTokens = paywall.bypasses?.map(bypass => bypass.token) ?? [];
    const hasBypass = hasValidBypass(validTokens);

    if (hasBypass) {
      return { hideContent: false, showPaywall: false };
    }

    return {
      showPaywall:
        ctx.showPaywall ??
        !paywall?.memberPlans.some(memberPlan =>
          memberPlanIds.includes(memberPlan.id)
        ),
      hideContent:
        ctx.hideContent ??
        !paywall?.memberPlans.some(memberPlan =>
          memberPlanIds.includes(memberPlan.id)
        ),
    };
  }, [
    subscriptions,
    paywall,
    user?.permissions,
    ctx.showPaywall,
    ctx.hideContent,
  ]);
};
