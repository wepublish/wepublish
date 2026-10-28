import { EngagementAudience, EngagementPlacement } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import {
  EngagementRuleValues,
  EngagementStageValues,
  isHard,
} from './engagement-rule-values';

/** What a rule needs for conflicts: form values or a saved rule. */
export type ConflictRule = Pick<
  EngagementRuleValues,
  | 'name'
  | 'active'
  | 'priority'
  | 'audience'
  | 'audienceMemberPlanIds'
  | 'showOnArticles'
  | 'showOnPageIds'
> & {
  /** Missing on a rule that was not saved yet. */
  id?: string;
  createdAt?: string;
  stages: Array<Pick<EngagementStageValues, 'placement' | 'enforcement'>>;
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
};

/** Mirrors `AUDIENCE_SPECIFICITY` in `engagement-api`'s `evaluate.ts`. */
export const AUDIENCE_SPECIFICITY: Record<EngagementAudience, number> = {
  [EngagementAudience.All]: 0,
  [EngagementAudience.NonPaying]: 1,
  [EngagementAudience.NonMembers]: 1,
  [EngagementAudience.Registered]: 1,
  [EngagementAudience.Anonymous]: 2,
  [EngagementAudience.Members]: 2,
  [EngagementAudience.PayingMembers]: 3,
  [EngagementAudience.PaywallBypassed]: 3,
  [EngagementAudience.MemberPlans]: 4,
};

type Reader = 'anonymous' | 'registered' | 'freeMember' | 'payingMember';

// Who an audience can be. A paywall bypass link can be opened by anyone, and a
// member of chosen plans can pay or not.
const READERS: Record<EngagementAudience, Reader[]> = {
  [EngagementAudience.All]: [
    'anonymous',
    'registered',
    'freeMember',
    'payingMember',
  ],
  [EngagementAudience.Anonymous]: ['anonymous'],
  [EngagementAudience.Registered]: ['registered', 'freeMember', 'payingMember'],
  [EngagementAudience.NonMembers]: ['anonymous', 'registered'],
  [EngagementAudience.Members]: ['freeMember', 'payingMember'],
  [EngagementAudience.NonPaying]: ['anonymous', 'registered', 'freeMember'],
  [EngagementAudience.PayingMembers]: ['payingMember'],
  [EngagementAudience.PaywallBypassed]: [
    'anonymous',
    'registered',
    'freeMember',
    'payingMember',
  ],
  [EngagementAudience.MemberPlans]: ['freeMember', 'payingMember'],
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

const slotsOf = (rule: ConflictRule) => new Set(rule.stages.map(slotOf));

const audiencesOverlap = (a: ConflictRule, b: ConflictRule) => {
  if (
    a.audience === EngagementAudience.MemberPlans &&
    b.audience === EngagementAudience.MemberPlans
  ) {
    return a.audienceMemberPlanIds.some(id =>
      b.audienceMemberPlanIds.includes(id)
    );
  }

  return READERS[a.audience].some(reader =>
    READERS[b.audience].includes(reader)
  );
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
 * The active rules that may want the same spot as `rule` for the same reader
 * on the same article or page. Stages are not compared by read count, so two
 * stages that never show at the same time still count.
 */
export function findConflicts<Rule extends ConflictRule>(
  rule: ConflictRule,
  others: Rule[]
): Array<EngagementConflict<Rule>> {
  const slots = slotsOf(rule);

  return others.flatMap(other => {
    if (!other.active || (rule.id && other.id === rule.id)) {
      return [];
    }

    const shared = [...slotsOf(other)].filter(slot => slots.has(slot));

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
