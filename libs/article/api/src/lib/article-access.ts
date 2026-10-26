import { EngagementRequirement } from '@prisma/client';
import {
  MeteredAccess,
  ReaderContext,
  isMeteredRestriction,
} from '@wepublish/engagement/api';

export enum ArticleAccessSource {
  PAYWALL = 'PAYWALL',
  ENGAGEMENT_RULE = 'ENGAGEMENT_RULE',
}

export type AccessPaywall = {
  id: string;
  active: boolean;
  enforced: boolean;
  anyMemberPlan: boolean;
  hideContentAfter: number;
  memberPlanIds: string[];
  bypassTokens: string[];
};

export type ArticleRestriction = {
  granted: false;
  source: ArticleAccessSource;
  requirement: EngagementRequirement;
  previewBlocks: number;
  paywallId?: string;
  ruleId?: string;
  stageId?: string;
};

export type ArticleAccessResult = { granted: true } | ArticleRestriction;

export const isRestricted = (
  access: ArticleAccessResult
): access is ArticleRestriction => !access.granted;

export function evaluateArticleAccess({
  reader,
  paywall,
  metered,
  bypassToken,
}: {
  reader: ReaderContext;
  paywall?: AccessPaywall | null;
  metered: MeteredAccess;
  bypassToken?: string | null;
}): ArticleAccessResult {
  if (reader.privileged) {
    return { granted: true };
  }

  if (paywall?.active) {
    if (!paywall.enforced) {
      return { granted: true };
    }

    const member =
      (paywall.anyMemberPlan && reader.activeMemberPlanIds.length > 0) ||
      paywall.memberPlanIds.some(id => reader.activeMemberPlanIds.includes(id));
    const bypassed =
      !!bypassToken && paywall.bypassTokens.includes(bypassToken);

    return member || bypassed ?
        { granted: true }
      : {
          granted: false,
          source: ArticleAccessSource.PAYWALL,
          paywallId: paywall.id,
          requirement: EngagementRequirement.MEMBERSHIP,
          previewBlocks: paywall.hideContentAfter,
        };
  }

  if (!isMeteredRestriction(metered)) {
    return { granted: true };
  }

  return {
    granted: false,
    source: ArticleAccessSource.ENGAGEMENT_RULE,
    ruleId: metered.ruleId,
    stageId: metered.stageId,
    requirement: metered.requirement,
    previewBlocks: metered.previewBlocks,
  };
}
