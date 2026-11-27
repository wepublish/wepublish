/**
 * Subscription flows decide which mail (or letter) goes out on an event. A
 * step that switches an event of "the subscription's flow" has to pick the
 * same flow the API will use.
 */

export type FlowInterval = {
  id: string;
  event: string;
  daysAwayFromEnding: number | null;
  sendAsLetter: boolean;
  mailTemplate: { id: string } | null;
};

export type Flow = {
  id: string;
  default: boolean;
  memberPlan: { id: string } | null;
  paymentMethods: { id: string }[];
  periodicities: string[];
  autoRenewal: boolean[];
  intervals: FlowInterval[];
};

export type FlowQuery = {
  memberPlanId: string;
  paymentMethodId: string;
  periodicity: string;
  autoRenew: boolean;
};

/**
 * The flow the API applies to a subscription: the first flow of its plan for
 * its payment method, periodicity and renewal, else the default flow. Mirrors
 * SubscriptionEventDictionary.getActionsForSubscriptions in libs/membership/api.
 */
export function flowFor(flows: Flow[], query: FlowQuery): Flow {
  const matching = flows.find(
    flow =>
      !flow.default &&
      flow.memberPlan?.id === query.memberPlanId &&
      flow.paymentMethods.some(({ id }) => id === query.paymentMethodId) &&
      flow.periodicities.includes(query.periodicity) &&
      flow.autoRenewal.includes(query.autoRenew)
  );

  if (matching) {
    return matching;
  }

  const fallback = flows.find(flow => flow.default);

  if (!fallback) {
    throw new Error('The target has no default subscription flow to fall back to.');
  }

  return fallback;
}
