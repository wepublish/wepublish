import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
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
  newsletterReferral: NewsletterReferralMode.None,
  newsletterReferralLimit: 0,
  newsletterParams: [],
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
      newsletterReferral: NewsletterReferralMode.Limited,
      newsletterReferralLimit: 3,
      newsletterParams: [{ key: 'utm_medium', value: 'email' }],
      stages: [
        stageDefaults({
          afterArticles: 2,
          placement: EngagementPlacement.Modal,
          actions: [actionDefaults({ type: EngagementActionType.Newsletter })],
        }),
        hardStage({
          afterArticles: 4,
          requirement: EngagementRequirement.Registration,
          actions: [
            actionDefaults({ type: EngagementActionType.Newsletter }),
            actionDefaults({
              type: EngagementActionType.Register,
              role: EngagementActionRole.Other,
            }),
            actionDefaults({
              type: EngagementActionType.Login,
              role: EngagementActionRole.Other,
            }),
          ],
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
  displayAnnouncement: () =>
    rule({
      goal: EngagementGoal.Announcement,
      stages: [stageDefaults({ placement: EngagementPlacement.Banner })],
    }),
};

export const RESTRICT_PREMIUM_PATH = '/articles/paywalls/create?enforced=true';
