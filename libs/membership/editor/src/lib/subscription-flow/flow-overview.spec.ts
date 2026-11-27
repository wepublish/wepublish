import {
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';

import {
  conditionsSummary,
  filterFlowRows,
  flowPath,
  flowRows,
  flowWarnings,
  newFlowId,
} from './flow-overview';

const interval = (
  event: SubscriptionEvent,
  template: string | null,
  sendAsLetter = false
) => ({
  id: `${event}-${template}`,
  event,
  daysAwayFromEnding: null,
  sendAsLetter,
  mailTemplate: template ? { id: template, name: template } : null,
});

const flow = (overrides: Record<string, unknown>) =>
  ({
    id: 'flow',
    default: false,
    memberPlan: null,
    autoRenewal: [],
    paymentMethods: [],
    periodicities: [],
    intervals: [],
    numberOfSubscriptions: 0,
    ...overrides,
  }) as unknown as SubscriptionFlowFragment;

const defaultFlow = flow({
  id: 'default-id',
  default: true,
  numberOfSubscriptions: 40,
  intervals: [
    interval(SubscriptionEvent.Subscribe, 'welcome'),
    interval(SubscriptionEvent.InvoiceCreation, 'invoice', true),
    interval(SubscriptionEvent.DeactivationUnpaid, null),
  ],
});

const printYearly = flow({
  id: 'print-yearly',
  memberPlan: { id: 'print', name: 'Print', availablePaymentMethods: [] },
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: [PaymentPeriodicity.Yearly],
  autoRenewal: [true, false],
  numberOfSubscriptions: 7,
  intervals: [
    interval(SubscriptionEvent.InvoiceCreation, null),
    interval(SubscriptionEvent.DeactivationUnpaid, null),
  ],
});

const digital = flow({
  id: 'digital',
  memberPlan: { id: 'digital', name: 'Digital', availablePaymentMethods: [] },
  paymentMethods: [{ id: 'card', name: 'Karte' }],
  periodicities: [PaymentPeriodicity.Monthly],
  autoRenewal: [true],
});

const printMonthly = flow({
  id: 'print-monthly',
  memberPlan: { id: 'print', name: 'Print', availablePaymentMethods: [] },
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: [PaymentPeriodicity.Monthly],
  autoRenewal: [true],
});

const t = (key: string) => key;

describe('flowRows', () => {
  const rows = flowRows([printYearly, digital, defaultFlow, printMonthly], t);

  it('puts the default flow first, then the flows by member plan and conditions', () => {
    expect(rows.map(row => row.id)).toEqual([
      'default-id',
      'digital',
      'print-monthly',
      'print-yearly',
    ]);
  });

  it('counts the events that send a message, out of all the flow could send', () => {
    // Five events of the subscription itself, plus the days on the timeline.
    expect(rows[0]).toMatchObject({
      isDefault: true,
      subscriptions: 40,
      eventsWithTemplate: 2,
      eventsTotal: 7,
      letterEvents: 1,
    });
    expect(rows[3]).toMatchObject({
      isDefault: false,
      memberPlanId: 'print',
      memberPlanName: 'Print',
      subscriptions: 7,
      eventsWithTemplate: 0,
      eventsTotal: 7,
      letterEvents: 0,
    });
  });

  it('does not count a letter for an event without a template', () => {
    const [row] = flowRows(
      [
        flow({
          intervals: [interval(SubscriptionEvent.InvoiceCreation, null, true)],
        }),
      ],
      t
    );

    expect(row.letterEvents).toBe(0);
  });
});

describe('conditionsSummary', () => {
  it('names payment methods, periodicities and renewal of a flow', () => {
    expect(conditionsSummary(printYearly, t)).toBe(
      'Rechnung · memberPlanList.paymentPeriodicity.yearly · subscriptionFlow.overview.renewal.true, subscriptionFlow.overview.renewal.false'
    );
  });

  it('leaves out what a flow does not narrow', () => {
    expect(conditionsSummary(defaultFlow, t)).toBe('');
  });
});

describe('filterFlowRows', () => {
  const rows = flowRows([defaultFlow, printYearly, digital, printMonthly], t);

  it('keeps everything without a member plan chosen', () => {
    expect(filterFlowRows(rows, [])).toEqual(rows);
  });

  it('keeps the flows of the chosen plans and always the default flow', () => {
    expect(filterFlowRows(rows, ['print']).map(row => row.id)).toEqual([
      'default-id',
      'print-monthly',
      'print-yearly',
    ]);
    expect(filterFlowRows(rows, ['unknown']).map(row => row.id)).toEqual([
      'default-id',
    ]);
  });
});

describe('newFlowId', () => {
  it('finds the flow that was not there before', () => {
    expect(
      newFlowId(['default-id', 'digital'], [defaultFlow, printYearly, digital])
    ).toBe('print-yearly');
  });

  it('finds nothing when no flow was added', () => {
    expect(newFlowId(['default-id'], [defaultFlow])).toBeUndefined();
    expect(newFlowId(['default-id'], undefined)).toBeUndefined();
  });
});

describe('flowPath', () => {
  it('addresses the default flow by name and the others by id', () => {
    expect(flowPath(defaultFlow)).toBe('/communicationflows/flow/default');
    expect(flowPath(digital)).toBe('/communicationflows/flow/digital');
  });
});

describe('flowWarnings', () => {
  const translate = (key: string, options?: Record<string, unknown>) =>
    options ? `${key}(${Object.values(options).join(',')})` : key;

  const plan = (
    offers: Array<{
      paymentMethods: string[];
      periodicities: PaymentPeriodicity[];
      forceAutoRenewal?: boolean;
    }>
  ) => ({
    id: 'print',
    name: 'Print',
    availablePaymentMethods: offers.map(offer => ({
      paymentMethods: offer.paymentMethods.map(id => ({ id, name: id })),
      paymentPeriodicities: offer.periodicities,
      forceAutoRenewal: offer.forceAutoRenewal ?? false,
    })),
  });

  const planFlow = (overrides: Record<string, unknown>) =>
    flow({
      memberPlan: plan([
        {
          paymentMethods: ['bill', 'card'],
          periodicities: [PaymentPeriodicity.Yearly],
        },
      ]),
      paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
      periodicities: [PaymentPeriodicity.Yearly],
      autoRenewal: [true, false],
      ...overrides,
    });

  it('has nothing to say about the default flow or a flow the plan fully offers', () => {
    expect(flowWarnings(defaultFlow, translate)).toEqual([]);
    expect(flowWarnings(planFlow({}), translate)).toEqual([]);
  });

  it('warns that a flow without a member plan stops every automatic message', () => {
    expect(flowWarnings(planFlow({ memberPlan: null }), translate)).toEqual([
      'subscriptionFlow.overview.warnings.noMemberPlan',
    ]);
  });

  it('warns that a flow without a payment method applies to no subscription', () => {
    expect(flowWarnings(planFlow({ paymentMethods: [] }), translate)).toEqual([
      'subscriptionFlow.overview.warnings.matchesNothing',
    ]);
  });

  it('names payment methods and periodicities the plan no longer offers', () => {
    expect(
      flowWarnings(
        planFlow({
          paymentMethods: [
            { id: 'bill', name: 'Rechnung' },
            { id: 'twint', name: 'Twint' },
          ],
          periodicities: [
            PaymentPeriodicity.Yearly,
            PaymentPeriodicity.Monthly,
          ],
        }),
        translate
      )
    ).toEqual([
      'subscriptionFlow.overview.warnings.notOffered(Twint, memberPlanList.paymentPeriodicity.monthly)',
    ]);
  });

  it('names "without renewal" when the plan always renews automatically', () => {
    expect(
      flowWarnings(
        planFlow({
          memberPlan: plan([
            {
              paymentMethods: ['bill'],
              periodicities: [PaymentPeriodicity.Yearly],
              forceAutoRenewal: true,
            },
          ]),
        }),
        translate
      )
    ).toEqual([
      'subscriptionFlow.overview.warnings.notOffered(subscriptionFlow.overview.renewal.false)',
    ]);
  });
});
