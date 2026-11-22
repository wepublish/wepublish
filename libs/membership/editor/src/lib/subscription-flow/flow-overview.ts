import { SubscriptionFlowFragment } from '@wepublish/editor/api';

import { legacyChoiceOf } from './filter/flow-filters';
import { isNonUserEvent, USER_ACTION_EVENTS } from './flow-events';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const FLOWS_PATH = '/communicationflows';

/** The address parameter that narrows the overview to member plans. */
export const MEMBER_PLAN_PARAM = 'memberPlan';

/** The overview, narrowed to the flows of one member plan. */
export const flowsOfMemberPlanPath = (memberPlanId: string) =>
  `${FLOWS_PATH}?${MEMBER_PLAN_PARAM}=${encodeURIComponent(memberPlanId)}`;

/** The page of one flow. The default flow has a stable address. */
export const flowPath = (
  flow: Pick<SubscriptionFlowFragment, 'id' | 'default'>
) => `${FLOWS_PATH}/flow/${flow.default ? 'default' : flow.id}`;

/**
 * Which subscriptions a flow applies to, in words. Empty for the default
 * flow, which narrows nothing. A flow for all plans takes any value of a
 * condition it leaves open, and says so rather than leaving a gap.
 */
export const conditionsSummary = (
  flow: SubscriptionFlowFragment,
  t: Translate
) => {
  const orAny = (values: string[], any: string) =>
    values.length ? values.join(', ')
    : flow.allMemberPlans ? t(`subscriptionFlow.overview.any.${any}`)
    : '';

  return [
    orAny(
      flow.paymentMethods.map(paymentMethod => paymentMethod.name),
      'paymentMethods'
    ),
    orAny(
      flow.periodicities.map(periodicity =>
        t(`memberPlanList.paymentPeriodicity.${periodicity}`)
      ),
      'periodicities'
    ),
    orAny(
      flow.autoRenewal.map(autoRenewal =>
        t(`subscriptionFlow.overview.renewal.${autoRenewal}`)
      ),
      'renewal'
    ),
    // Only when narrowed: a flow for everybody says nothing about legacy.
    legacyChoiceOf(flow.legacy) === 'all' ? '' : (
      t(`subscriptionFlow.legacyFilter.${legacyChoiceOf(flow.legacy)}`)
    ),
  ]
    .filter(Boolean)
    .join(' · ');
};

/**
 * How early an event of the flow may lie, and why. A member plan's flow: the
 * invoice of a subscription is only created once its current period has
 * begun, so the shortest periodicity of its conditions sets the day. The
 * default flow: its day is fixed, as every subscription may fall back to it.
 */
export const earliestDayHint = (
  flow: SubscriptionFlowFragment,
  t: Translate
): string => {
  const { days, periodicity } = flow.earliestDay;

  if (flow.default) {
    return t('subscriptionFlow.earliestDay.defaultFlow', { days: -days });
  }

  // A flow for all plans that leaves the term open: any term, so also the
  // shortest.
  return periodicity ?
      t('subscriptionFlow.earliestDay.byConditions', {
        days: -days,
        periodicity: t(`memberPlanList.paymentPeriodicity.${periodicity}`),
      })
    : t('subscriptionFlow.earliestDay.anyTerm', { days: -days });
};

/**
 * What makes a member plan's flow do less than its conditions say. A flow is
 * matched against each subscription when a message is due, so nothing breaks
 * when a plan changes; but the admin should see what has gone stale.
 */
export const flowWarnings = (
  flow: SubscriptionFlowFragment,
  t: Translate
): string[] => {
  if (flow.default) {
    return [];
  }

  // Left behind by a deleted plan: the api refuses to look up any message
  // while such a flow exists. A flow for all plans has none by design.
  if (!flow.memberPlan && !flow.allMemberPlans) {
    return [t('subscriptionFlow.overview.warnings.noMemberPlan')];
  }

  const given = [
    flow.paymentMethods,
    flow.periodicities,
    flow.autoRenewal,
  ].filter(values => values.length).length;

  // A member plan's flow needs every condition; a flow for all plans takes
  // any value of one it leaves open, but needs at least one.
  if (flow.allMemberPlans ? given === 0 : given < 3) {
    return [t('subscriptionFlow.overview.warnings.matchesNothing')];
  }

  // No single plan has to offer what a flow for all plans is for.
  if (!flow.memberPlan) {
    return [];
  }

  const offers = flow.memberPlan.availablePaymentMethods;
  const offeredMethods = new Set(
    offers.flatMap(offer => offer.paymentMethods.map(method => method.id))
  );
  const offeredPeriodicities = new Set(
    offers.flatMap(offer => offer.paymentPeriodicities)
  );
  const offersWithoutRenewal = offers.some(offer => !offer.forceAutoRenewal);

  // Still matched by subscriptions taken out before the plan changed.
  const notOffered = [
    ...flow.paymentMethods
      .filter(method => !offeredMethods.has(method.id))
      .map(method => method.name),
    ...flow.periodicities
      .filter(periodicity => !offeredPeriodicities.has(periodicity))
      .map(periodicity =>
        t(`memberPlanList.paymentPeriodicity.${periodicity}`)
      ),
    ...(flow.autoRenewal.includes(false) && !offersWithoutRenewal ?
      [t('subscriptionFlow.overview.renewal.false')]
    : []),
  ];

  return notOffered.length ?
      [
        t('subscriptionFlow.overview.warnings.notOffered', {
          values: notOffered.join(', '),
        }),
      ]
    : [];
};

/** A flow as the overview lists it. */
export type FlowRow = {
  id: string;
  flow: SubscriptionFlowFragment;
  isDefault: boolean;
  /** For the matching subscriptions of every member plan. */
  allMemberPlans: boolean;
  /** Switched off flows are skipped; their subscriptions go to the next. */
  active: boolean;
  memberPlanId?: string;
  /** The plan's name; "all member plans" for a flow for all of them. */
  memberPlanName?: string;
  /** The heading the row is listed under: standard, all plans, or its plan. */
  group: string;
  conditions: string;
  /** What makes the flow do less than its conditions say. */
  warnings: string[];
  subscriptions: number;
  /** Events that have a template, so something is sent. */
  eventsWithTemplate: number;
  /** The events of the subscription itself plus the days on the timeline. */
  eventsTotal: number;
  /** Events that are also printed for people on the letter channel. */
  letterEvents: number;
};

const byText = (a = '', b = '') =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

/**
 * Every flow as a row: the default flow first, then the flows for all plans,
 * then by plan and conditions.
 */
export const flowRows = (
  flows: SubscriptionFlowFragment[],
  t: Translate,
  /** Counts narrowed to a filter, by flow id; else each flow's own. */
  counts?: Map<string, number>
): FlowRow[] =>
  flows
    .map(flow => {
      const sending = flow.intervals.filter(interval => interval.mailTemplate);

      return {
        id: flow.id,
        flow,
        isDefault: flow.default,
        allMemberPlans: !!flow.allMemberPlans,
        active: flow.active !== false,
        memberPlanId: flow.memberPlan?.id,
        memberPlanName:
          flow.allMemberPlans ?
            t('subscriptionFlow.overview.allMemberPlans')
          : flow.memberPlan?.name,
        group:
          flow.default ? t('subscriptionFlow.overview.group.default')
          : flow.allMemberPlans ?
            t('subscriptionFlow.overview.group.allMemberPlans')
          : flow.memberPlan ?
            t('subscriptionFlow.overview.group.memberPlan', {
              memberPlan: flow.memberPlan.name,
            })
          : t('subscriptionFlow.overview.noMemberPlan'),
        conditions: conditionsSummary(flow, t),
        warnings: flowWarnings(flow, t),
        subscriptions: counts?.get(flow.id) ?? flow.numberOfSubscriptions,
        eventsWithTemplate: sending.length,
        eventsTotal:
          USER_ACTION_EVENTS.length +
          flow.intervals.filter(interval => isNonUserEvent(interval.event))
            .length,
        letterEvents: sending.filter(interval => interval.sendAsLetter).length,
      };
    })
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        Number(b.allMemberPlans) - Number(a.allMemberPlans) ||
        byText(a.memberPlanName, b.memberPlanName) ||
        byText(a.conditions, b.conditions)
    );

/** What the overview can be narrowed by. Nothing chosen narrows nothing. */
export type FlowFilter = {
  memberPlanIds: string[];
};

/**
 * The flows of the chosen member plans: which flows a subscription of such a
 * plan could fall into. So the default flow always stays, and so do the flows
 * for all plans.
 */
export const filterFlowRows = (
  rows: FlowRow[],
  { memberPlanIds = [] }: Partial<FlowFilter>
) =>
  memberPlanIds.length ?
    rows.filter(
      row =>
        row.isDefault ||
        row.allMemberPlans ||
        (!!row.memberPlanId && memberPlanIds.includes(row.memberPlanId))
    )
  : rows;

/** The flow a create mutation added; the api answers with all flows. */
export const newFlowId = (
  knownIds: string[],
  flows: Pick<SubscriptionFlowFragment, 'id'>[] | undefined
) => flows?.find(flow => !knownIds.includes(flow.id))?.id;
