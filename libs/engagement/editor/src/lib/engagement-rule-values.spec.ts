import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  FullEngagementRuleFragment,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  actionDefaults,
  copyEngagementRule,
  createEngagementRuleSchema,
  engagementRuleProblems,
  engagementRuleToValues,
  hardStage,
  SHOW_FIRST_PRIORITY,
  showsFirst,
  stageDefaults,
  toEngagementRuleInput,
} from './engagement-rule-values';
import { ENGAGEMENT_PRESETS } from './presets';

const t = ((key: string) => key) as unknown as TFunction;

const rule: FullEngagementRuleFragment = {
  __typename: 'EngagementRule',
  id: 'rule-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Grow newsletter',
  goal: EngagementGoal.Newsletter,
  active: true,
  priority: 2,
  version: 3,
  audience: EngagementAudience.Anonymous,
  audienceMemberPlanIds: [],
  showOnArticles: true,
  showOnPageIds: ['page-1'],
  includePeeredArticles: false,
  meterWindowDays: 30,
  stages: [
    {
      __typename: 'EngagementStage',
      id: 'stage-1',
      afterArticles: 2,
      placement: EngagementPlacement.Modal,
      enforcement: EngagementEnforcement.Soft,
      requirement: null,
      previewBlocks: null,
      dismissible: true,
      hideForMinutes: 1440,
      delaySeconds: 0,
      title: 'Like it?',
      text: null,
      cta: null,
      description: null,
      html: null,
      embedUrl: null,
      imageId: null,
      image: null,
      actions: [
        {
          __typename: 'EngagementAction',
          id: 'action-1',
          type: EngagementActionType.Newsletter,
          label: 'Subscribe',
          url: 'https://example.com/newsletter',
          style: '',
          role: EngagementActionRole.Primary,
        },
      ],
    },
  ],
};

const metered = (
  overrides: Partial<EngagementRuleValues> = {}
): EngagementRuleValues => ({ ...engagementRuleToValues(rule), ...overrides });

describe('engagement rule values', () => {
  it('turns a rule into the input it was created from', () => {
    expect(toEngagementRuleInput(engagementRuleToValues(rule))).toEqual({
      name: 'Grow newsletter',
      goal: EngagementGoal.Newsletter,
      active: true,
      priority: 2,
      audience: EngagementAudience.Anonymous,
      audienceMemberPlanIds: [],
      showOnArticles: true,
      showOnPageIds: ['page-1'],
      includePeeredArticles: false,
      meterWindowDays: 30,
      stages: [
        {
          afterArticles: 2,
          placement: EngagementPlacement.Modal,
          enforcement: EngagementEnforcement.Soft,
          requirement: null,
          previewBlocks: null,
          dismissible: true,
          hideForMinutes: 1440,
          delaySeconds: 0,
          title: 'Like it?',
          text: null,
          cta: null,
          description: null,
          html: null,
          embedUrl: null,
          imageId: null,
          actions: [
            {
              type: EngagementActionType.Newsletter,
              label: 'Subscribe',
              url: 'https://example.com/newsletter',
              style: '',
              role: EngagementActionRole.Primary,
            },
          ],
        },
      ],
    });
  });

  it('needs member plans for the member plans audience', () => {
    expect(
      engagementRuleProblems(
        metered({ audience: EngagementAudience.MemberPlans })
      )
    ).toContainEqual({ path: 'audienceMemberPlanIds', code: 'required' });
    expect(
      engagementRuleProblems(
        metered({
          audience: EngagementAudience.MemberPlans,
          audienceMemberPlanIds: ['plan-1'],
        })
      )
    ).not.toContainEqual(
      expect.objectContaining({ path: 'audienceMemberPlanIds' })
    );
  });

  it('only sends member plans for the member plans audience', () => {
    const values = engagementRuleToValues({
      ...rule,
      audience: EngagementAudience.MemberPlans,
      audienceMemberPlanIds: ['plan-1'],
    });

    expect(values.audienceMemberPlanIds).toEqual(['plan-1']);
    expect(toEngagementRuleInput(values).audienceMemberPlanIds).toEqual([
      'plan-1',
    ]);
    // Switching the audience keeps the selection in the form, not on save.
    expect(
      toEngagementRuleInput({
        ...values,
        audience: EngagementAudience.Members,
      }).audienceMemberPlanIds
    ).toEqual([]);
  });

  it('finds what the server would refuse, with its codes', () => {
    expect(
      engagementRuleProblems(
        metered({
          stages: [
            hardStage({ afterArticles: 4 }),
            stageDefaults({ afterArticles: 2 }),
          ],
        })
      )
    ).toEqual([
      { path: 'stages.0.enforcement', code: 'hardNotLast' },
      { path: 'stages.0.requirement', code: 'newsletterWallRequired' },
      {
        path: 'stages.1.afterArticles',
        code: 'ascending',
        params: { step: 1, count: 4 },
      },
    ]);
  });

  it('asks for whole numbers in its own words', () => {
    const result = createEngagementRuleSchema(t).safeParse(
      metered({
        meterWindowDays: 1.5,
        stages: [stageDefaults({ afterArticles: 0, delaySeconds: -1 })],
      })
    );

    expect(
      result.error?.issues.map(({ path, message }) => [path.join('.'), message])
    ).toEqual([
      ['meterWindowDays', 'engagement.validation.wholeNumber'],
      ['stages.0.delaySeconds', 'engagement.validation.min'],
    ]);
  });

  it('refuses inconsistent stages in the form, at the field', () => {
    const result = createEngagementRuleSchema(t).safeParse(
      metered({
        stages: [
          stageDefaults({ afterArticles: 2 }),
          hardStage({
            afterArticles: 2,
            requirement: EngagementRequirement.Membership,
            actions: [
              {
                type: EngagementActionType.Newsletter,
                label: '',
                url: '',
                style: '',
                role: EngagementActionRole.Primary,
              },
            ],
          }),
        ],
      })
    );

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.map(({ path, message }) => [path.join('.'), message])
    ).toEqual([
      ['stages.1.afterArticles', 'engagement.validation.ascending'],
      ['stages.1.requirement', 'engagement.validation.newsletterWallRequired'],
    ]);
  });

  it('needs no newsletter action on a newsletter wall, which is the signup', () => {
    expect(
      engagementRuleProblems(
        metered({
          goal: EngagementGoal.Newsletter,
          stages: [
            stageDefaults({ afterArticles: 2 }),
            hardStage({
              afterArticles: 4,
              requirement: EngagementRequirement.Newsletter,
            }),
          ],
        })
      )
    ).toEqual([]);
  });

  it('needs a url where an action leads away, like the server', () => {
    const actionProblems = (
      placement: EngagementPlacement,
      actions: Parameters<typeof actionDefaults>[0][]
    ) =>
      engagementRuleProblems(
        metered({
          stages: [
            stageDefaults({
              afterArticles: 0,
              placement,
              actions: actions.map(actionDefaults),
            }),
          ],
        })
      ).filter(({ path }) => path.includes('.actions.'));

    expect(
      actionProblems(EngagementPlacement.Modal, [
        { type: EngagementActionType.Url },
        { type: EngagementActionType.Url, role: EngagementActionRole.Cancel },
        { type: EngagementActionType.Newsletter },
      ])
    ).toEqual([{ path: 'stages.0.actions.0.url', code: 'required' }]);
    expect(
      actionProblems(EngagementPlacement.Banner, [
        { type: EngagementActionType.Newsletter },
      ])
    ).toEqual([{ path: 'stages.0.actions.0.url', code: 'required' }]);
  });

  it('accepts a consistent rule', () => {
    expect(createEngagementRuleSchema(t).safeParse(metered()).success).toBe(
      true
    );
  });

  it('starts every preset from a consistent rule, apart from the urls to fill in', () => {
    for (const preset of Object.values(ENGAGEMENT_PRESETS)) {
      expect(
        engagementRuleProblems(preset()).filter(
          ({ code, path }) => !(code === 'required' && path.endsWith('.url'))
        )
      ).toEqual([]);
    }
  });
});

describe('showsFirst', () => {
  it('is any priority above the default', () => {
    expect(showsFirst(SHOW_FIRST_PRIORITY)).toBe(true);
    expect(showsFirst(3)).toBe(true);
    expect(showsFirst(0)).toBe(false);
    expect(showsFirst(-10)).toBe(false);
  });
});

describe('copyEngagementRule', () => {
  const t = ((key: string, params: Record<string, string> = {}) =>
    key === 'engagement.copyName' ?
      `${params['name']} (copy)`
    : key) as unknown as TFunction;

  it('copies everything but marks the name and stays inactive', () => {
    const copy = copyEngagementRule(rule, t);

    expect(copy).toEqual({
      ...engagementRuleToValues(rule),
      name: 'Grow newsletter (copy)',
      active: false,
    });
  });
});
