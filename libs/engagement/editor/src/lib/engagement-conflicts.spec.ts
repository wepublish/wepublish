import { EngagementAudience, EngagementPlacement } from '@wepublish/editor/api';
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
});
