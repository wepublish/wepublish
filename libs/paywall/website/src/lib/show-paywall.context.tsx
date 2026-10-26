import {
  ArticleAccessSource,
  FullArticleAccessFragment,
  FullPaywallFragment,
} from '@wepublish/website/api';
import { createContext, useContext, useMemo } from 'react';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import { useUser } from '@wepublish/authentication/website';
import { hasValidPaywallBypass } from './paywall-bypass';
import { CanGetArticle } from '@wepublish/permissions';
import { useArticleAccess } from './article-access-store';

export const ShowPaywallContext = createContext<{
  showPaywall?: boolean;
  hideContent?: boolean;
}>({});

type ShowPaywall = { showPaywall: boolean; hideContent: boolean };

export function decideShowPaywall({
  paywall,
  memberPlanIds,
  canGetArticle,
  hasBypass,
  ctx,
  serverAccess,
}: {
  paywall?: FullPaywallFragment | null;
  memberPlanIds: string[];
  canGetArticle: boolean;
  hasBypass: (validTokens: string[]) => boolean;
  ctx: { showPaywall?: boolean; hideContent?: boolean };
  serverAccess?: FullArticleAccessFragment;
}): ShowPaywall {
  if (!paywall || !paywall.active) {
    return { hideContent: false, showPaywall: false };
  }

  if (paywall.enforced && serverAccess) {
    const restricted =
      !serverAccess.granted &&
      serverAccess.source === ArticleAccessSource.Paywall;

    return {
      showPaywall: ctx.showPaywall ?? restricted,
      hideContent: ctx.hideContent ?? restricted,
    };
  }

  if (canGetArticle) {
    return { hideContent: false, showPaywall: false };
  }

  if (paywall.anyMemberPlan && memberPlanIds.length) {
    return { showPaywall: false, hideContent: false };
  }

  if (hasBypass(paywall.bypasses?.map(bypass => bypass.token) ?? [])) {
    return { hideContent: false, showPaywall: false };
  }

  const isMember = paywall.memberPlans.some(memberPlan =>
    memberPlanIds.includes(memberPlan.id)
  );

  return {
    showPaywall: ctx.showPaywall ?? !isMember,
    hideContent: ctx.hideContent ?? !isMember,
  };
}

/**
 * For an enforced paywall, the server decides (`viewArticle`, by `articleId`):
 * it only sent the preview blocks, and every block once the reader may read
 * on. Without an article id, or for paywalls that are not enforced, the
 * website decides as before.
 */
export const useShowPaywall = (
  paywall?: FullPaywallFragment | null,
  articleId?: string | null
): ShowPaywall => {
  const subscriptions = useActiveSubscriptions();
  const { user } = useUser();
  const ctx = useContext(ShowPaywallContext);
  const serverAccess = useArticleAccess(articleId);

  return useMemo(
    () =>
      decideShowPaywall({
        paywall,
        memberPlanIds: subscriptions?.map(s => s.memberPlan.id) ?? [],
        canGetArticle: !!user?.permissions.includes(CanGetArticle.id),
        hasBypass: hasValidPaywallBypass,
        ctx,
        serverAccess,
      }),
    [subscriptions, paywall, serverAccess, user?.permissions, ctx]
  );
};
