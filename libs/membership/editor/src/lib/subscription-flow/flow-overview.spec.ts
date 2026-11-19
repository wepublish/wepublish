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
  memberPlan: { id: 'print', name: 'Print' },
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
  memberPlan: { id: 'digital', name: 'Digital' },
  paymentMethods: [{ id: 'card', name: 'Karte' }],
  periodicities: [PaymentPeriodicity.Monthly],
  autoRenewal: [true],
});

const printMonthly = flow({
  id: 'print-monthly',
  memberPlan: { id: 'print', name: 'Print' },
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
