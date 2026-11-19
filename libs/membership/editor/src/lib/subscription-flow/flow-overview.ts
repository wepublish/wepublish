import { SubscriptionFlowFragment } from '@wepublish/editor/api';

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
 * Which subscriptions a member plan's flow applies to, in words. Empty for
 * the default flow, which narrows nothing.
 */
export const conditionsSummary = (
  flow: SubscriptionFlowFragment,
  t: Translate
) =>
  [
    flow.paymentMethods.map(paymentMethod => paymentMethod.name).join(', '),
    flow.periodicities
      .map(periodicity => t(`memberPlanList.paymentPeriodicity.${periodicity}`))
      .join(', '),
    flow.autoRenewal
      .map(autoRenewal => t(`subscriptionFlow.overview.renewal.${autoRenewal}`))
      .join(', '),
  ]
    .filter(Boolean)
    .join(' · ');

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
  // while such a flow exists.
  if (!flow.memberPlan) {
    return [t('subscriptionFlow.overview.warnings.noMemberPlan')];
  }

  if (
    !flow.paymentMethods.length ||
    !flow.periodicities.length ||
    !flow.autoRenewal.length
  ) {
    return [t('subscriptionFlow.overview.warnings.matchesNothing')];
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
  memberPlanId?: string;
  memberPlanName?: string;
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

/** Every flow as a row: the default flow first, then by plan and conditions. */
export const flowRows = (
  flows: SubscriptionFlowFragment[],
  t: Translate
): FlowRow[] =>
  flows
    .map(flow => {
      const sending = flow.intervals.filter(interval => interval.mailTemplate);

      return {
        id: flow.id,
        flow,
        isDefault: flow.default,
        memberPlanId: flow.memberPlan?.id,
        memberPlanName: flow.memberPlan?.name,
        conditions: conditionsSummary(flow, t),
        warnings: flowWarnings(flow, t),
        subscriptions: flow.numberOfSubscriptions,
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
        byText(a.memberPlanName, b.memberPlanName) ||
        byText(a.conditions, b.conditions)
    );

/**
 * The flows of the chosen member plans. The default flow always stays: it is
 * what applies to every subscription of those plans no other flow matches.
 */
export const filterFlowRows = (rows: FlowRow[], memberPlanIds: string[]) =>
  memberPlanIds.length ?
    rows.filter(
      row =>
        row.isDefault ||
        (row.memberPlanId && memberPlanIds.includes(row.memberPlanId))
    )
  : rows;

/** The flow a create mutation added; the api answers with all flows. */
export const newFlowId = (
  knownIds: string[],
  flows: Pick<SubscriptionFlowFragment, 'id'>[] | undefined
) => flows?.find(flow => !knownIds.includes(flow.id))?.id;
