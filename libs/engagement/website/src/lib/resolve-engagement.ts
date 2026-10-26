import {
  ArticleAccessSource,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  FullArticleAccessFragment,
  FullEngagementPromptFragment,
} from '@wepublish/website/api';

/** When each prompt was dismissed (ms), by `dismissalKey`. */
export type EngagementDismissals = Record<string, number>;

export type EngagementRestriction = {
  source: ArticleAccessSource;
  /** The hard stage of a metered rule. An enforced paywall renders itself. */
  prompt?: FullEngagementPromptFragment;
};

export type ResolvedEngagement = {
  restriction?: EngagementRestriction;
  banner?: FullEngagementPromptFragment;
  modal?: FullEngagementPromptFragment;
  inline?: FullEngagementPromptFragment;
};

/** A changed rule (new version) shows again, even when it was dismissed. */
export const dismissalKey = ({
  ruleId,
  ruleVersion,
  stage,
}: FullEngagementPromptFragment) => `${ruleId}:${ruleVersion}:${stage.id}`;

const isDismissed = (
  prompt: FullEngagementPromptFragment,
  dismissals: EngagementDismissals,
  legacyBannerClosedAt: number | undefined,
  now: number
) => {
  if (!prompt.stage.dismissible) {
    return false;
  }

  const hiddenFor = prompt.stage.hideForMinutes * 60 * 1000;
  const closedAt = [
    dismissals[dismissalKey(prompt)],
    // Banners closed before the update stay closed, as they did before.
    prompt.stage.placement === EngagementPlacement.Banner ?
      legacyBannerClosedAt
    : undefined,
  ].filter((at): at is number => typeof at === 'number');

  return closedAt.some(at => now - at < hiddenFor);
};

const slotOf = ({ stage }: FullEngagementPromptFragment) => {
  if (stage.enforcement === EngagementEnforcement.Hard) {
    return undefined;
  }

  switch (stage.placement) {
    case EngagementPlacement.Banner:
      return 'banner';
    case EngagementPlacement.Modal:
      return 'modal';
    // A soft cutoff shows after the article, like an inline prompt.
    case EngagementPlacement.Inline:
    case EngagementPlacement.Cutoff:
      return 'inline';
  }
};

/**
 * Which prompt goes where on a page:
 *
 * 1. A restriction takes the cutoff slot: the hard stage that restricts the
 *    article, or the article's enforced paywall.
 * 2. While restricted there is no modal and no inline prompt, and only an
 *    announcement may show as banner.
 * 3. Dismissed prompts stay hidden for their `hideForMinutes`, unless they can
 *    not be dismissed.
 * 4. Each slot gets at most one prompt, in the order the server sent them.
 */
export function resolveEngagement({
  access,
  prompts,
  dismissals,
  legacyBannerClosedAt,
  now,
}: {
  access?: FullArticleAccessFragment | null;
  prompts: FullEngagementPromptFragment[];
  dismissals: EngagementDismissals;
  legacyBannerClosedAt?: number;
  now: number;
}): ResolvedEngagement {
  const resolved: ResolvedEngagement = {};
  const restricted = !!access && !access.granted;

  if (restricted) {
    resolved.restriction = {
      source: access.source ?? ArticleAccessSource.EngagementRule,
      prompt:
        access.source === ArticleAccessSource.EngagementRule ?
          prompts.find(({ stage }) => stage.id === access.stageId)
        : undefined,
    };
  }

  for (const prompt of prompts) {
    const slot = slotOf(prompt);

    if (
      !slot ||
      resolved[slot] ||
      isDismissed(prompt, dismissals, legacyBannerClosedAt, now)
    ) {
      continue;
    }

    if (
      restricted &&
      (slot !== 'banner' || prompt.goal !== EngagementGoal.Announcement)
    ) {
      continue;
    }

    resolved[slot] = prompt;
  }

  return resolved;
}
