import {
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';

import {
  conditionsSummary,
  earliestDayHint,
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
    earliestDay: { days: -360, periodicity: null },
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

// For the yearly subscriptions of every plan that has no flow for them.
const allPlansYearly = flow({
  id: 'all-yearly',
  allMemberPlans: true,
  paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
  periodicities: [PaymentPeriodicity.Yearly],
  autoRenewal: [true],
});

const t = (key: string) => key;

describe('flowRows', () => {
  it('puts a flow for all plans after the default flow and names it so', () => {
    const [first, second] = flowRows(
      [printYearly, allPlansYearly, defaultFlow],
      t
    );

    expect(first.id).toBe('default-id');
    expect(second).toMatchObject({
      id: 'all-yearly',
      allMemberPlans: true,
      memberPlanName: 'subscriptionFlow.overview.allMemberPlans',
    });
  });

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

describe('conditionsSummary of a flow for all plans', () => {
  it('says "any" for a condition left open, so nothing reads as missing', () => {
    expect(
      conditionsSummary(
        flow({
          allMemberPlans: true,
          periodicities: [PaymentPeriodicity.Yearly],
        }),
        t
      )
    ).toBe(
      'subscriptionFlow.overview.any.paymentMethods · memberPlanList.paymentPeriodicity.yearly · subscriptionFlow.overview.any.renewal'
    );
  });
});

describe('flowRows groups', () => {
  it('names the group of every row: standard, all plans, or its member plan', () => {
    expect(
      flowRows([defaultFlow, allPlansYearly, printYearly, digital], t).map(
        row => row.group
      )
    ).toEqual([
      'subscriptionFlow.overview.group.default',
      'subscriptionFlow.overview.group.allMemberPlans',
      'subscriptionFlow.overview.group.memberPlan',
      'subscriptionFlow.overview.group.memberPlan',
    ]);
  });

  it('names the member plan in the group of its flows', () => {
    const translate = (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.values(options).join(',')})` : key;

    expect(flowRows([printYearly], translate)[0].group).toBe(
      'subscriptionFlow.overview.group.memberPlan(Print)'
    );
  });
});

describe('filterFlowRows', () => {
  const rows = flowRows([defaultFlow, printYearly, digital, printMonthly], t);
  const ids = (filter: Parameters<typeof filterFlowRows>[1], of = rows) =>
    filterFlowRows(of, filter).map(row => row.id);

  it('keeps everything without a filter', () => {
    expect(filterFlowRows(rows, {})).toEqual(rows);
  });

  it('keeps the flows of the chosen plans and always the default flow', () => {
    expect(ids({ memberPlanIds: ['print'] })).toEqual([
      'default-id',
      'print-monthly',
      'print-yearly',
    ]);
    expect(ids({ memberPlanIds: ['unknown'] })).toEqual(['default-id']);
  });

  it('keeps a flow for all plans: it applies to the chosen plans too', () => {
    const withAllPlans = flowRows(
      [defaultFlow, printYearly, allPlansYearly],
      t
    );

    expect(ids({ memberPlanIds: ['digital'] }, withAllPlans)).toEqual([
      'default-id',
      'all-yearly',
    ]);
  });

  // The conditions: which flows a subscription like this could fall into.
  describe('by condition', () => {
    it('narrows to the flows for a term, payment method or renewal', () => {
      expect(ids({ periodicities: [PaymentPeriodicity.Yearly] })).toEqual([
        'default-id',
        'print-yearly',
      ]);
      expect(ids({ paymentMethodIds: ['card'] })).toEqual([
        'default-id',
        'digital',
      ]);
      expect(ids({ renewal: ['false'] })).toEqual([
        'default-id',
        'print-yearly',
      ]);
    });

    it('needs every chosen kind of condition to match', () => {
      expect(
        ids({
          periodicities: [PaymentPeriodicity.Monthly],
          paymentMethodIds: ['bill'],
        })
      ).toEqual(['default-id', 'print-monthly']);
    });

    it('keeps a flow for all plans that leaves the condition open: it takes any value', () => {
      const anyPayment = flow({
        id: 'all-any-payment',
        allMemberPlans: true,
        periodicities: [PaymentPeriodicity.Yearly],
      });

      expect(
        ids({ paymentMethodIds: ['card'] }, flowRows([anyPayment, digital], t))
      ).toEqual(['all-any-payment', 'digital']);
      expect(
        ids(
          { periodicities: [PaymentPeriodicity.Monthly] },
          flowRows([anyPayment, digital], t)
        )
      ).toEqual(['digital']);
    });
  });

  // The state of a flow: these look at the default flow like at any other.
  describe('by state', () => {
    const withWarning = flow({
      id: 'stale',
      memberPlan: { id: 'print', name: 'Print', availablePaymentMethods: [] },
      paymentMethods: [{ id: 'bill', name: 'Rechnung' }],
      periodicities: [PaymentPeriodicity.Yearly],
      autoRenewal: [true],
    });
    // Only the stale flow carries a warning here.
    const stateRows = flowRows([defaultFlow, printYearly, withWarning], t).map(
      row => ({ ...row, warnings: row.id === 'stale' ? ['stale'] : [] })
    );

    it('narrows to the flows with or without a warning', () => {
      expect(ids({ warnings: ['with'] }, stateRows)).toEqual(['stale']);
      expect(ids({ warnings: ['without'] }, stateRows)).toEqual([
        'default-id',
        'print-yearly',
      ]);
      expect(ids({ warnings: ['with', 'without'] }, stateRows)).toHaveLength(
        stateRows.length
      );
    });

    it('narrows to the flows with or without subscriptions', () => {
      expect(ids({ subscriptions: ['with'] }, stateRows)).toEqual([
        'default-id',
        'print-yearly',
      ]);
      expect(ids({ subscriptions: ['without'] }, stateRows)).toEqual(['stale']);
    });
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

  it('has nothing to say about a flow for all plans: no plan is missing, and none has to offer its conditions', () => {
    expect(flowWarnings(allPlansYearly, translate)).toEqual([]);
  });

  it('has nothing to say about a flow for all plans with conditions left open: they take any value', () => {
    expect(
      flowWarnings(
        flow({
          allMemberPlans: true,
          periodicities: [PaymentPeriodicity.Yearly],
        }),
        translate
      )
    ).toEqual([]);
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

describe('earliestDayHint', () => {
  const translate = (key: string, options?: Record<string, unknown>) =>
    options ? `${key}(${Object.values(options).join(',')})` : key;

  it('explains a plan flow by the shortest periodicity of its conditions', () => {
    expect(
      earliestDayHint(
        flow({
          default: false,
          earliestDay: { days: -85, periodicity: PaymentPeriodicity.Quarterly },
        }),
        translate
      )
    ).toBe(
      'subscriptionFlow.earliestDay.byConditions(85,memberPlanList.paymentPeriodicity.quarterly)'
    );
  });

  it('says of a flow for all plans with an open term that any term includes the shortest', () => {
    expect(
      earliestDayHint(
        flow({
          allMemberPlans: true,
          earliestDay: { days: -25, periodicity: null },
        }),
        translate
      )
    ).toBe('subscriptionFlow.earliestDay.anyTerm(25)');
  });

  it('says of the default flow that its day is fixed: it is the fallback of every subscription', () => {
    expect(
      earliestDayHint(
        flow({ default: true, earliestDay: { days: -25, periodicity: null } }),
        translate
      )
    ).toBe('subscriptionFlow.earliestDay.defaultFlow(25)');
  });
});
