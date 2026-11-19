import {
  EarliestInvoiceDaysQuery,
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';

/** How early an invoice may be created, per periodicity, as the api tells it. */
export type EarliestInvoiceDays = EarliestInvoiceDaysQuery['earliestInvoiceDays'];

/** What a member plan offers together: payment methods and periodicities. */
export type PlanOffer = {
  paymentPeriodicities: PaymentPeriodicity[];
  paymentMethods: { id: string }[];
  forceAutoRenewal: boolean;
};

/**
 * The earliest invoice day that suits every one of the periodicities: that of
 * the shortest, the one closest to the end of the subscription.
 */
const earliestOf = (
  periodicities: PaymentPeriodicity[],
  days: EarliestInvoiceDays
) =>
  days
    .filter(({ periodicity }) => periodicities.includes(periodicity))
    .sort((a, b) => b.days - a.days)[0];

/**
 * How early the invoices of the plan's subscriptions may be created, and the
 * periodicity that sets it. Nothing while the plan offers no periodicity.
 */
export const planEarliestInvoiceDay = (
  offers: PlanOffer[],
  days: EarliestInvoiceDays
) =>
  earliestOf(
    offers.flatMap(offer => offer.paymentPeriodicities),
    days
  );

/** Whether a plan flow applies to subscriptions like these. */
const takes = (
  flow: SubscriptionFlowFragment,
  periodicity: PaymentPeriodicity,
  paymentMethodId: string,
  autoRenew: boolean
) =>
  flow.periodicities.includes(periodicity) &&
  flow.paymentMethods.some(({ id }) => id === paymentMethodId) &&
  flow.autoRenewal.includes(autoRenew);

/**
 * The periodicities of the plan a flow applies to. A plan flow: those it
 * shares with the plan. The default flow: those of which the plan flows leave
 * it at least some subscriptions.
 */
const periodicitiesOf = (
  flow: SubscriptionFlowFragment,
  offers: PlanOffer[],
  planFlows: SubscriptionFlowFragment[]
) => {
  const offered = offers.flatMap(offer =>
    offer.paymentPeriodicities.flatMap(periodicity =>
      offer.paymentMethods.flatMap(({ id }) =>
        (offer.forceAutoRenewal ? [true] : [true, false]).map(autoRenew => ({
          periodicity,
          paymentMethodId: id,
          autoRenew,
        }))
      )
    )
  );

  return [
    ...new Set(
      offered
        .filter(({ periodicity, paymentMethodId, autoRenew }) =>
          flow.default ?
            !planFlows.some(planFlow =>
              takes(planFlow, periodicity, paymentMethodId, autoRenew)
            )
          : takes(flow, periodicity, paymentMethodId, autoRenew)
        )
        .map(({ periodicity }) => periodicity)
    ),
  ];
};

/** A flow that creates invoices earlier than the plan's subscriptions allow. */
export type InvoiceDayConflict = {
  flow: SubscriptionFlowFragment;
  /** The day the flow creates invoices on. */
  invoiceDay: number;
  /** The periodicity of the plan the day is too early for. */
  periodicity: PaymentPeriodicity;
  /** The day the invoices of those subscriptions are created on instead. */
  days: number;
};

/**
 * The flows the plan's subscriptions run through that create invoices earlier
 * than the plan's periodicities allow: the default flow and the plan's own.
 */
export const invoiceDayConflicts = (
  offers: PlanOffer[],
  flows: SubscriptionFlowFragment[],
  days: EarliestInvoiceDays
): InvoiceDayConflict[] => {
  const planFlows = flows.filter(flow => !flow.default);

  return flows.flatMap(flow => {
    const invoiceDay = flow.intervals.find(
      interval => interval.event === SubscriptionEvent.InvoiceCreation
    )?.daysAwayFromEnding;
    const earliest = earliestOf(periodicitiesOf(flow, offers, planFlows), days);

    return invoiceDay != null && earliest && invoiceDay < earliest.days ?
        [{ flow, invoiceDay, ...earliest }]
      : [];
  });
};
