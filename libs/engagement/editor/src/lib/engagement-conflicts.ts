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
import { summarizeAudience } from './summarize-rule';

export type ConflictRule = Pick<
  EngagementRuleValues,
  | 'name'
  | 'goal'
  | 'active'
  | 'priority'
  | 'audiences'
  | 'excludedAudiences'
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
  audience: Pick<ConflictRule, 'audiences' | 'excludedAudiences'>;
  /** Whether the rule the conflicts were found for is shown first. */
  first: boolean;
  /**
   * One of the two rules is set to show first: the order was chosen, nothing
   * is left to decide.
   */
  settled: boolean;
};

/** Mirrors `audienceSpecificity` in `engagement-api`'s `evaluate.ts`. */
const AUDIENCE_SPECIFICITY: Record<EngagementAudience, number> = {
  [EngagementAudience.Anonymous]: 2,
  [EngagementAudience.Members]: 2,
  [EngagementAudience.PaywallBypassed]: 3,
  [EngagementAudience.Utm]: 3,
};

export const audienceSpecificity = ({
  audiences,
  excludedAudiences,
  audienceMemberPlanIds,
}: Pick<
  ConflictRule,
  'audiences' | 'excludedAudiences' | 'audienceMemberPlanIds'
>) =>
  audiences.length ?
    Math.max(
      ...audiences.map(audience =>
        (
          audience === EngagementAudience.Members &&
          audienceMemberPlanIds.length
        ) ?
          4
        : AUDIENCE_SPECIFICITY[audience]
      )
    )
  : Number(excludedAudiences.length > 0);

type Reader = 'anonymous' | 'registered' | 'member';

const EVERYONE: Reader[] = ['anonymous', 'registered', 'member'];

// Who an audience can be. Anyone can open a bypass link or a link with utm params.
const READERS: Record<EngagementAudience, Reader[]> = {
  [EngagementAudience.Anonymous]: ['anonymous'],
  [EngagementAudience.Members]: ['member'],
  [EngagementAudience.PaywallBypassed]: EVERYONE,
  [EngagementAudience.Utm]: EVERYONE,
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

  const shown =
    rule.audiences.length ?
      rule.audiences.flatMap(audience => READERS[audience])
    : EVERYONE;
  // Only leaving out every anonymous reader or every member removes a kind of reader.
  const left = rule.excludedAudiences.flatMap(audience =>
    (
      audience === EngagementAudience.Anonymous ||
      (audience === EngagementAudience.Members &&
        !rule.audienceMemberPlanIds.length)
    ) ?
      READERS[audience]
    : []
  );

  return shown.filter(
    reader => !left.includes(reader) && !meet.includes(reader)
  );
};

const audiencesOverlap = (a: ConflictRule, b: ConflictRule) => {
  const onlyPlans = (rule: ConflictRule) =>
    rule.audiences.length === 1 &&
    rule.audiences[0] === EngagementAudience.Members &&
    rule.audienceMemberPlanIds.length > 0;

  if (
    onlyPlans(a) &&
    onlyPlans(b) &&
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
    audienceSpecificity(b) - audienceSpecificity(a) ||
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
          audienceSpecificity(other) > audienceSpecificity(rule) ? other : rule,
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
      audience: summarizeAudience(audience, t),
    }),
    first ?
      t('engagement.conflict.thisFirst')
    : t('engagement.conflict.otherFirst', { name: rule.name }),
  ].join(' ');
}
