import {
  EngagementAudience,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import { findConflicts, ConflictRule } from './engagement-conflicts';
import { hardStage, stageDefaults } from './engagement-rule-values';
import { ENGAGEMENT_PRESETS } from './presets';

const banner = (overrides: Partial<ConflictRule> = {}): ConflictRule => ({
  ...ENGAGEMENT_PRESETS.displayAnnouncement(),
  id: 'banner',
  name: 'Crowdfunding launch',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const names = (conflicts: ReturnType<typeof findConflicts>) =>
  conflicts.map(({ rule }) => rule.name);

describe('findConflicts', () => {
  it('finds active rules that want the same spot for the same readers', () => {
    const rule = banner({ id: undefined, name: 'New', createdAt: undefined });

    expect(findConflicts(rule, [banner()])).toEqual([
      {
        rule: expect.objectContaining({ name: 'Crowdfunding launch' }),
        slots: ['banner'],
        audience: EngagementAudience.All,
        // An unsaved rule is the newest.
        first: true,
        settled: false,
      },
    ]);
  });

  it('ignores the rule itself and inactive rules', () => {
    expect(findConflicts(banner(), [banner()])).toEqual([]);
    expect(
      findConflicts(banner({ id: 'new' }), [banner({ active: false })])
    ).toEqual([]);
  });

  it('ignores rules in other spots', () => {
    const modal = banner({
      id: 'modal',
      stages: [stageDefaults({ placement: EngagementPlacement.Modal })],
    });

    expect(findConflicts(banner({ id: 'new' }), [modal])).toEqual([]);
  });

  it('ignores rules for other readers', () => {
    const anonymous = banner({ audience: EngagementAudience.Anonymous });
    const members = banner({ id: 'new', audience: EngagementAudience.Members });

    expect(findConflicts(members, [anonymous])).toEqual([]);
  });

  it('leaves out readers who already meet what a rule restricts for', () => {
    // Logged-in readers never see a rule that asks them to register.
    const askToRegister = banner({
      id: 'new',
      stages: [
        stageDefaults({ placement: EngagementPlacement.Banner }),
        hardStage({
          afterArticles: 3,
          requirement: EngagementRequirement.Registration,
        }),
      ],
    });
    const forRegistered = (audience: EngagementAudience) =>
      banner({ audience });

    expect(
      findConflicts(askToRegister, [
        forRegistered(EngagementAudience.Registered),
      ])
    ).toEqual([]);
    expect(
      findConflicts(askToRegister, [
        forRegistered(EngagementAudience.NonMembers),
      ])
    ).toHaveLength(1);
  });

  it('names the narrower of the two audiences', () => {
    const anonymous = banner({ audience: EngagementAudience.Anonymous });

    expect(findConflicts(banner({ id: 'new' }), [anonymous])).toMatchObject([
      { audience: EngagementAudience.Anonymous, first: false },
    ]);
  });

  it('only finds rules for specific plans with a plan in common', () => {
    const plans = (id: string, audienceMemberPlanIds: string[]) =>
      banner({
        id,
        audience: EngagementAudience.MemberPlans,
        audienceMemberPlanIds,
      });

    expect(
      names(findConflicts(plans('new', ['a']), [plans('other', ['b'])]))
    ).toEqual([]);
    expect(
      names(findConflicts(plans('new', ['a', 'b']), [plans('other', ['b'])]))
    ).toEqual(['Crowdfunding launch']);
    expect(
      names(
        findConflicts(plans('new', ['a']), [
          banner({ audience: EngagementAudience.Members }),
        ])
      )
    ).toEqual(['Crowdfunding launch']);
  });

  it('only finds rules on the same articles or pages', () => {
    const page = (id: string, pageId: string) =>
      banner({ id, showOnArticles: false, showOnPageIds: [pageId] });

    expect(findConflicts(page('new', 'p1'), [page('other', 'p2')])).toEqual([]);
    expect(
      names(findConflicts(page('new', 'p1'), [page('other', 'p1')]))
    ).toEqual(['Crowdfunding launch']);
  });

  it('counts restrictions as one spot', () => {
    const restricting = (id: string) =>
      banner({
        id,
        stages: [hardStage({ afterArticles: 3 })],
      });

    expect(
      findConflicts(restricting('new'), [restricting('other')])
    ).toMatchObject([{ slots: ['restriction'] }]);
  });

  it('puts the rule shown first by priority, specificity, then age', () => {
    const [byPriority] = findConflicts(banner({ id: 'new', priority: 10 }), [
      banner({ audience: EngagementAudience.Anonymous }),
    ]);
    const [byAge] = findConflicts(
      banner({ id: 'new', createdAt: '2025-01-01T00:00:00.000Z' }),
      [banner()]
    );

    expect(byPriority.first).toBe(true);
    expect(byAge.first).toBe(false);
  });

  const metered = (
    id: string,
    stages: Array<[number, EngagementPlacement]>,
    meterWindowDays = 30
  ): ConflictRule =>
    banner({
      id,
      goal: EngagementGoal.Membership,
      meterWindowDays,
      stages: stages.map(([afterArticles, placement]) =>
        stageDefaults({ afterArticles, placement })
      ),
    });

  it('ignores stages that never show at the same read count', () => {
    // Pop-up for articles 1–2 against a pop-up from article 6 on.
    const early = metered('new', [
      [0, EngagementPlacement.Modal],
      [2, EngagementPlacement.Inline],
    ]);

    expect(
      findConflicts(early, [metered('other', [[5, EngagementPlacement.Modal]])])
    ).toEqual([]);
    expect(
      findConflicts(early, [metered('other', [[1, EngagementPlacement.Modal]])])
    ).toMatchObject([{ slots: ['modal'] }]);
  });

  it('compares read counts only within the same window', () => {
    const early = metered('new', [
      [0, EngagementPlacement.Modal],
      [2, EngagementPlacement.Inline],
    ]);

    expect(
      findConflicts(early, [
        metered('other', [[5, EngagementPlacement.Modal]], 7),
      ])
    ).toMatchObject([{ slots: ['modal'] }]);
  });

  it('has an announcement compete at every read count', () => {
    expect(
      findConflicts(banner({ id: 'new' }), [
        metered('other', [[9, EngagementPlacement.Banner]]),
      ])
    ).toMatchObject([{ slots: ['banner'] }]);
  });

  it('marks a conflict settled once one of the rules is shown first', () => {
    const [settled] = findConflicts(banner({ id: 'new' }), [
      banner({ priority: 10 }),
    ]);
    const [tie] = findConflicts(banner({ id: 'new', priority: 10 }), [
      banner({ priority: 10 }),
    ]);

    expect(settled).toMatchObject({ settled: true, first: false });
    expect(tie).toMatchObject({ settled: false });
  });
});
