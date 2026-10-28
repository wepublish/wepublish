import {
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
} from '@prisma/client';
import {
  EngagementRuleDraft,
  EngagementStageDraft,
  validateEngagementRule,
} from './validate-engagement-rule';

const soft = (
  afterArticles: number,
  overrides: Partial<EngagementStageDraft> = {}
): EngagementStageDraft => ({
  afterArticles,
  placement: EngagementPlacement.MODAL,
  enforcement: EngagementEnforcement.SOFT,
  requirement: null,
  previewBlocks: null,
  actions: [],
  ...overrides,
});

const hard = (
  afterArticles: number,
  overrides: Partial<EngagementStageDraft> = {}
): EngagementStageDraft => ({
  afterArticles,
  placement: EngagementPlacement.CUTOFF,
  enforcement: EngagementEnforcement.HARD,
  requirement: EngagementRequirement.REGISTRATION,
  previewBlocks: 3,
  actions: [],
  ...overrides,
});

const metered = (
  overrides: Partial<EngagementRuleDraft> = {}
): EngagementRuleDraft => ({
  goal: EngagementGoal.MEMBERSHIP,
  meterWindowDays: 30,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  stages: [soft(2), hard(4)],
  ...overrides,
});

const announcement = (
  overrides: Partial<EngagementRuleDraft> = {}
): EngagementRuleDraft => ({
  goal: EngagementGoal.ANNOUNCEMENT,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  stages: [soft(0, { placement: EngagementPlacement.BANNER })],
  ...overrides,
});

const codes = (rule: EngagementRuleDraft) =>
  validateEngagementRule(rule).map(({ path, code }) => `${path}: ${code}`);

describe('validateEngagementRule', () => {
  it('accepts a soft modal followed by a hard registration cutoff', () => {
    expect(codes(metered())).toEqual([]);
  });

  it('accepts an announcement', () => {
    expect(codes(announcement())).toEqual([]);
  });

  it('needs at least one stage', () => {
    expect(codes(metered({ stages: [] }))).toEqual(['stages: required']);
  });

  it('needs unique stages in ascending order', () => {
    expect(codes(metered({ stages: [soft(4), hard(2)] }))).toContain(
      'stages.1.afterArticles: ascending'
    );
    expect(codes(metered({ stages: [soft(2), soft(2)] }))).toContain(
      'stages.1.afterArticles: ascending'
    );
    expect(codes(metered({ stages: [soft(-1)] }))).toContain(
      'stages.0.afterArticles: min'
    );
  });

  it('only allows a hard stage last', () => {
    expect(codes(metered({ stages: [hard(2), soft(4)] }))).toContain(
      'stages.0.enforcement: hardNotLast'
    );
  });

  it('only allows a hard stage as a cutoff', () => {
    expect(
      codes(
        metered({
          stages: [soft(2), hard(4, { placement: EngagementPlacement.MODAL })],
        })
      )
    ).toContain('stages.1.placement: hardNeedsCutoff');
  });

  it('needs a requirement and preview blocks on a hard stage', () => {
    expect(
      codes(
        metered({
          stages: [hard(4, { requirement: null, previewBlocks: null })],
        })
      )
    ).toEqual([
      'stages.0.requirement: required',
      'stages.0.previewBlocks: required',
    ]);

    expect(
      codes(metered({ stages: [hard(4, { previewBlocks: -1 })] }))
    ).toEqual(['stages.0.previewBlocks: min']);
    expect(codes(metered({ stages: [hard(0, { previewBlocks: 0 })] }))).toEqual(
      []
    );
  });

  it('keeps requirements and preview blocks off soft stages', () => {
    expect(
      codes(
        metered({
          stages: [
            soft(2, {
              requirement: EngagementRequirement.MEMBERSHIP,
              previewBlocks: 2,
            }),
          ],
        })
      )
    ).toEqual([
      'stages.0.requirement: onlyHard',
      'stages.0.previewBlocks: onlyHard',
    ]);
  });

  it('keeps an announcement to one soft stage from the first article', () => {
    expect(codes(announcement({ stages: [soft(0), soft(2)] }))).toContain(
      'stages: announcementSingleStage'
    );
    expect(codes(announcement({ stages: [soft(1)] }))).toContain(
      'stages.0.afterArticles: announcementFromStart'
    );
    expect(codes(announcement({ stages: [hard(0)] }))).toContain(
      'stages.0.enforcement: announcementSoft'
    );
  });

  it('keeps meters and referrals off announcements', () => {
    expect(
      codes(
        announcement({
          meterWindowDays: 30,
          newsletterReferral: NewsletterReferralMode.UNLIMITED,
        })
      )
    ).toEqual([
      'meterWindowDays: announcementNoMeter',
      'newsletterReferral: announcementNoReferral',
    ]);
  });

  it('needs a meter window of at least a day for metered goals', () => {
    expect(codes(metered({ meterWindowDays: null }))).toEqual([
      'meterWindowDays: required',
    ]);
    expect(codes(metered({ meterWindowDays: 0 }))).toEqual([
      'meterWindowDays: min',
    ]);
  });

  it('needs a limit of at least one for limited referrals', () => {
    expect(
      codes(
        metered({
          newsletterReferral: NewsletterReferralMode.LIMITED,
          newsletterReferralLimit: 0,
        })
      )
    ).toEqual(['newsletterReferralLimit: min']);
  });

  it('needs a url on url and newsletter actions', () => {
    expect(
      codes(
        metered({
          stages: [
            soft(2, {
              actions: [
                { type: EngagementActionType.URL, url: '' },
                { type: EngagementActionType.NEWSLETTER, url: ' ' },
                { type: EngagementActionType.LOGIN, url: '' },
              ],
            }),
          ],
        })
      )
    ).toEqual([
      'stages.0.actions.0.url: required',
      'stages.0.actions.1.url: required',
    ]);
  });

  it('keeps the newsletter path open on a hard newsletter stage', () => {
    const newsletterAction = {
      type: EngagementActionType.NEWSLETTER,
      url: 'https://example.com/newsletter',
    };

    expect(codes(metered({ goal: EngagementGoal.NEWSLETTER }))).toContain(
      'stages.1.actions: newsletterActionRequired'
    );
    expect(
      codes(
        metered({
          goal: EngagementGoal.NEWSLETTER,
          stages: [soft(2), hard(4, { actions: [newsletterAction] })],
        })
      )
    ).toEqual([]);
  });

  it('needs plans for the member plans audience, and only there', () => {
    expect(
      codes(metered({ audience: EngagementAudience.MEMBER_PLANS }))
    ).toEqual(['audienceMemberPlanIds: required']);
    expect(
      codes(
        metered({
          audience: EngagementAudience.MEMBER_PLANS,
          audienceMemberPlanIds: ['plan-1'],
        })
      )
    ).toEqual([]);
    expect(
      codes(
        metered({
          audience: EngagementAudience.MEMBERS,
          audienceMemberPlanIds: ['plan-1'],
        })
      )
    ).toEqual(['audienceMemberPlanIds: onlyMemberPlans']);
  });
});
