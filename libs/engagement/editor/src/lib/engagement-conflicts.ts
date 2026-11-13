import {
  EngagementAudience,
  EngagementPlacement,
  EngagementRequirement,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  EngagementStageValues,
  isAnnouncement,
  isHard,
} from './engagement-rule-values';

/** What a rule needs for conflicts: form values or a saved rule. */
export type ConflictRule = Pick<
  EngagementRuleValues,
  | 'name'
  | 'goal'
  | 'active'
  | 'priority'
  | 'audience'
  | 'audienceMemberPlanIds'
  | 'showOnArticles'
  | 'showOnPageIds'
  | 'meterWindowDays'
> & {
  /** Missing on a rule that was not saved yet. */
  id?: string;
  createdAt?: string;
  stages: Array<
    Pick<
      EngagementStageValues,
      'placement' | 'enforcement' | 'afterArticles' | 'requirement'
    >
  >;
};

/**
 * The spots the website fills once per page (`resolve-engagement.ts`), plus
 * the restriction: only one rule can cut an article.
 */
export type EngagementSlot = 'banner' | 'modal' | 'inline' | 'restriction';

export type EngagementConflict<Rule extends ConflictRule = ConflictRule> = {
  rule: Rule;
  slots: EngagementSlot[];
  /** The readers both rules want: the narrower audience of the two. */
  audience: EngagementAudience;
  /** Whether the rule the conflicts were found for is shown first. */
  first: boolean;
  /**
   * One of the two rules is set to show first: the order was chosen, nothing
   * is left to decide.
   */
  settled: boolean;
};

/** Mirrors `AUDIENCE_SPECIFICITY` in `engagement-api`'s `evaluate.ts`. */
export const AUDIENCE_SPECIFICITY: Record<EngagementAudience, number> = {
  [EngagementAudience.All]: 0,
  [EngagementAudience.NonMembers]: 1,
  [EngagementAudience.Registered]: 1,
  [EngagementAudience.Anonymous]: 2,
  [EngagementAudience.Members]: 2,
  [EngagementAudience.PaywallBypassed]: 3,
  [EngagementAudience.MonthlyMembers]: 3,
  [EngagementAudience.MemberPlans]: 4,
};

type Reader = 'anonymous' | 'registered' | 'member';

// Who an audience can be. A paywall bypass link can be opened by anyone.
const READERS: Record<EngagementAudience, Reader[]> = {
  [EngagementAudience.All]: ['anonymous', 'registered', 'member'],
  [EngagementAudience.Anonymous]: ['anonymous'],
  [EngagementAudience.Registered]: ['registered', 'member'],
  [EngagementAudience.NonMembers]: ['anonymous', 'registered'],
  [EngagementAudience.Members]: ['member'],
  [EngagementAudience.PaywallBypassed]: ['anonymous', 'registered', 'member'],
  [EngagementAudience.MemberPlans]: ['member'],
  [EngagementAudience.MonthlyMembers]: ['member'],
};

const slotOf = (
  stage: Pick<EngagementStageValues, 'placement' | 'enforcement'>
): EngagementSlot => {
  if (isHard(stage)) {
    return 'restriction';
  }

  switch (stage.placement) {
    case EngagementPlacement.Banner:
      return 'banner';
    case EngagementPlacement.Modal:
      return 'modal';
    case EngagementPlacement.Inline:
    case EngagementPlacement.Cutoff:
      return 'inline';
  }
};

type ReadRange = { slot: EngagementSlot; from: number; to: number };

/**
 * Which spot a rule fills at which read counts: a stage shows from its
 * `afterArticles` until the next stage. An announcement shows at every count.
 */
const rangesOf = (rule: ConflictRule): ReadRange[] =>
  rule.stages.map((stage, index) => ({
    slot: slotOf(stage),
    from: isAnnouncement(rule) ? 0 : stage.afterArticles,
    to:
      isAnnouncement(rule) ? Infinity : (
        (rule.stages[index + 1]?.afterArticles ?? Infinity)
      ),
  }));

/**
 * The spots both rules can fill for the same reader at once. Read counts only
 * compare within the same window: in different windows, any two counts can
 * meet.
 */
const sharedSlots = (a: ConflictRule, b: ConflictRule): EngagementSlot[] => {
  const sameCount =
    !isAnnouncement(a) &&
    !isAnnouncement(b) &&
    a.meterWindowDays === b.meterWindowDays;
  const slots = new Set<EngagementSlot>();

  for (const x of rangesOf(a)) {
    for (const y of rangesOf(b)) {
      if (
        x.slot === y.slot &&
        (!sameCount || (x.from < y.to && y.from < x.to))
      ) {
        slots.add(x.slot);
      }
    }
  }

  return [...slots];
};

// Who already meets a requirement: they never see the rule at all.
const MEETS: Record<EngagementRequirement, Reader[]> = {
  [EngagementRequirement.Registration]: ['registered', 'member'],
  [EngagementRequirement.Membership]: ['member'],
  // Newsletter signups cut across all readers.
  [EngagementRequirement.Newsletter]: [],
};

/** Mirrors `matchingRules` in `engagement-api`'s `evaluate.ts`. */
const readersOf = (rule: ConflictRule) => {
  const requirement = rule.stages.find(isHard)?.requirement;
  const meet = requirement ? MEETS[requirement] : [];

  return READERS[rule.audience].filter(reader => !meet.includes(reader));
};

const audiencesOverlap = (a: ConflictRule, b: ConflictRule) => {
  if (
    a.audience === EngagementAudience.MemberPlans &&
    b.audience === EngagementAudience.MemberPlans &&
    !a.audienceMemberPlanIds.some(id => b.audienceMemberPlanIds.includes(id))
  ) {
    return false;
  }

  const readersOfB = readersOf(b);

  return readersOf(a).some(reader => readersOfB.includes(reader));
};

const targetsOverlap = (a: ConflictRule, b: ConflictRule) =>
  (a.showOnArticles && b.showOnArticles) ||
  a.showOnPageIds.some(id => b.showOnPageIds.includes(id));

// An unsaved rule is the newest.
const createdAtOf = (rule: ConflictRule) =>
  rule.createdAt ? new Date(rule.createdAt).getTime() : Infinity;

/** Mirrors the prompt order of `engagement-api`'s `evaluate.ts`. */
const showsBefore = (a: ConflictRule, b: ConflictRule) =>
  (b.priority - a.priority ||
    AUDIENCE_SPECIFICITY[b.audience] - AUDIENCE_SPECIFICITY[a.audience] ||
    Number(a.showOnArticles) - Number(b.showOnArticles) ||
    createdAtOf(b) - createdAtOf(a)) < 0;

/**
 * The active rules that want the same spot as `rule` for the same reader on
 * the same article or page, at the same time.
 */
export function findConflicts<Rule extends ConflictRule>(
  rule: ConflictRule,
  others: Rule[]
): Array<EngagementConflict<Rule>> {
  return others.flatMap(other => {
    if (!other.active || (rule.id && other.id === rule.id)) {
      return [];
    }

    const shared = sharedSlots(rule, other);

    if (
      !shared.length ||
      !audiencesOverlap(rule, other) ||
      !targetsOverlap(rule, other)
    ) {
      return [];
    }

    return [
      {
        rule: other,
        slots: shared,
        audience:
          (
            AUDIENCE_SPECIFICITY[other.audience] >
            AUDIENCE_SPECIFICITY[rule.audience]
          ) ?
            other.audience
          : rule.audience,
        first: showsBefore(rule, other),
        settled: rule.priority !== other.priority,
      },
    ];
  });
}

/**
 * E.g. "Competes with “Crowdfunding launch” for the banner (Anonymous
 * readers). “Crowdfunding launch” is shown first."
 */
export function describeConflict(
  { rule, slots, audience, first }: EngagementConflict,
  t: TFunction
): string {
  return [
    t('engagement.conflict.competes', {
      name: rule.name,
      slots: slots
        .map(slot => t(`engagement.conflict.slot.${slot}`))
        .join(', '),
      audience: t(`engagement.audience.${audience}`),
    }),
    first ?
      t('engagement.conflict.thisFirst')
    : t('engagement.conflict.otherFirst', { name: rule.name }),
  ].join(' ');
}
