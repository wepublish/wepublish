import {
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';

import {
  invoiceDayConflicts,
  PlanOffer,
  planEarliestInvoiceDay,
} from './earliest-invoice-day';

const days = [
  { periodicity: PaymentPeriodicity.Monthly, days: -25 },
  { periodicity: PaymentPeriodicity.Quarterly, days: -85 },
  { periodicity: PaymentPeriodicity.Yearly, days: -360 },
];

const offer = (
  periodicities: PaymentPeriodicity[],
  methods = ['bill'],
  forceAutoRenewal = false
): PlanOffer => ({
  paymentPeriodicities: periodicities,
  paymentMethods: methods.map(id => ({ id })),
  forceAutoRenewal,
});

const flow = (
  invoiceDay: number | null,
  conditions?: {
    periodicities: PaymentPeriodicity[];
    methods?: string[];
    autoRenewal?: boolean[];
  }
) =>
  ({
    id: conditions ? `plan-flow-${conditions.periodicities.join('-')}` : 'default',
    default: !conditions,
    periodicities: conditions?.periodicities ?? [],
    paymentMethods: (conditions?.methods ?? ['bill']).map(id => ({ id })),
    autoRenewal: conditions?.autoRenewal ?? (conditions ? [true, false] : []),
    intervals:
      invoiceDay === null ?
        []
      : [
          {
            id: 'invoice',
            event: SubscriptionEvent.InvoiceCreation,
            daysAwayFromEnding: invoiceDay,
          },
        ],
  }) as unknown as SubscriptionFlowFragment;

describe('planEarliestInvoiceDay', () => {
  it('follows the shortest periodicity the plan offers', () => {
    expect(
      planEarliestInvoiceDay(
        [offer([PaymentPeriodicity.Yearly]), offer([PaymentPeriodicity.Monthly])],
        days
      )
    ).toEqual({ periodicity: PaymentPeriodicity.Monthly, days: -25 });
  });

  it('has nothing to say while the plan offers no periodicity', () => {
    expect(planEarliestInvoiceDay([offer([])], days)).toBeUndefined();
    expect(planEarliestInvoiceDay([], days)).toBeUndefined();
  });

  it('has nothing to say before the days are known', () => {
    expect(
      planEarliestInvoiceDay([offer([PaymentPeriodicity.Monthly])], [])
    ).toBeUndefined();
  });
});

describe('invoiceDayConflicts', () => {
  const monthlyAndYearly = [
    offer([PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly]),
  ];

  it('finds the default flow creating invoices earlier than the plan allows', () => {
    expect(invoiceDayConflicts(monthlyAndYearly, [flow(-38)], days)).toEqual([
      {
        flow: expect.objectContaining({ id: 'default' }),
        invoiceDay: -38,
        periodicity: PaymentPeriodicity.Monthly,
        days: -25,
      },
    ]);
  });

  it('finds nothing while every flow suits the plan', () => {
    expect(invoiceDayConflicts(monthlyAndYearly, [flow(-25)], days)).toEqual(
      []
    );
    expect(
      invoiceDayConflicts([offer([PaymentPeriodicity.Yearly])], [flow(-38)], days)
    ).toEqual([]);
  });

  it('measures a plan flow by the periodicities it shares with the plan', () => {
    const yearlyFlow = flow(-38, {
      periodicities: [PaymentPeriodicity.Yearly],
    });
    const monthlyFlow = flow(-38, {
      periodicities: [PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly],
    });

    expect(
      invoiceDayConflicts(monthlyAndYearly, [yearlyFlow], days)
    ).toEqual([]);
    expect(
      invoiceDayConflicts(monthlyAndYearly, [monthlyFlow], days)
    ).toEqual([
      expect.objectContaining({
        flow: monthlyFlow,
        periodicity: PaymentPeriodicity.Monthly,
      }),
    ]);
  });

  it('leaves the default flow alone when plan flows take every monthly subscription', () => {
    const monthlyFlow = flow(-14, {
      periodicities: [PaymentPeriodicity.Monthly],
    });

    expect(
      invoiceDayConflicts(monthlyAndYearly, [flow(-38), monthlyFlow], days)
    ).toEqual([]);
  });

  it('keeps the default flow in when a plan flow takes only some monthly subscriptions', () => {
    const monthlyWithRenewal = flow(-14, {
      periodicities: [PaymentPeriodicity.Monthly],
      autoRenewal: [true],
    });

    expect(
      invoiceDayConflicts(
        monthlyAndYearly,
        [flow(-38), monthlyWithRenewal],
        days
      )
    ).toEqual([expect.objectContaining({ invoiceDay: -38 })]);

    // every subscription of this offer renews, so the flow takes them all
    expect(
      invoiceDayConflicts(
        [offer([PaymentPeriodicity.Monthly], ['bill'], true)],
        [flow(-38), monthlyWithRenewal],
        days
      )
    ).toEqual([]);
  });

  it('skips a flow without an invoice day', () => {
    expect(invoiceDayConflicts(monthlyAndYearly, [flow(null)], days)).toEqual(
      []
    );
  });
});
