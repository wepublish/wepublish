import {
  EngagementActionType,
  EngagementAudience,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import {
  EngagementRuleValues,
  actionDefaults,
  hardStage,
  stageDefaults,
} from './engagement-rule-values';

export type EngagementPresetId =
  | 'growNewsletter'
  | 'promoteMemberships'
  | 'switchToYearly'
  | 'restrictPremium'
  | 'displayAnnouncement';

const rule = (values: Partial<EngagementRuleValues>): EngagementRuleValues => ({
  name: '',
  goal: EngagementGoal.Announcement,
  active: false,
  priority: 0,
  audience: EngagementAudience.All,
  audienceMemberPlanIds: [],
  showOnArticles: true,
  showOnPageIds: [],
  includePeeredArticles: false,
  meterWindowDays: null,
  stages: [],
  ...values,
});

/**
 * Starting points of the form. A preset only fills in values: every rule is
 * edited in the same form. Restricting premium content is a paywall, so that
 * preset opens the paywall form instead.
 */
export const ENGAGEMENT_PRESETS: Record<
  Exclude<EngagementPresetId, 'restrictPremium'>,
  () => EngagementRuleValues
> = {
  growNewsletter: () =>
    rule({
      goal: EngagementGoal.Newsletter,
      audience: EngagementAudience.Anonymous,
      meterWindowDays: 30,
      stages: [
        stageDefaults({
          afterArticles: 2,
          placement: EngagementPlacement.Modal,
          actions: [actionDefaults({ type: EngagementActionType.Newsletter })],
        }),
        // The website asks for the email right in the cutoff.
        hardStage({
          afterArticles: 4,
          requirement: EngagementRequirement.Newsletter,
          actions: [],
        }),
      ],
    }),
  promoteMemberships: () =>
    rule({
      goal: EngagementGoal.Membership,
      audience: EngagementAudience.NonMembers,
      meterWindowDays: 30,
      stages: [
        stageDefaults({
          afterArticles: 3,
          placement: EngagementPlacement.Inline,
          actions: [actionDefaults({ type: EngagementActionType.Membership })],
        }),
      ],
    }),
  // Shown on every article, so a reader who closes it is left alone a month.
  switchToYearly: () =>
    rule({
      goal: EngagementGoal.Announcement,
      audience: EngagementAudience.MonthlyMembers,
      stages: [
        stageDefaults({
          placement: EngagementPlacement.Banner,
          hideForMinutes: 30 * 24 * 60,
          actions: [
            actionDefaults({ type: EngagementActionType.SwitchToYearly }),
          ],
        }),
      ],
    }),
  displayAnnouncement: () =>
    rule({
      goal: EngagementGoal.Announcement,
      stages: [stageDefaults({ placement: EngagementPlacement.Banner })],
    }),
};

export const RESTRICT_PREMIUM_PATH =
  '/audience-engagement/paywalls/create?enforced=true';
