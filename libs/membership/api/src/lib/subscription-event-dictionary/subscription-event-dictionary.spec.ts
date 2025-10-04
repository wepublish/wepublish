import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { add, format, sub } from 'date-fns';

import nock from 'nock';
import { SubscriptionEventDictionary } from './subscription-event-dictionary';

describe('SubscriptionEventDictionary', () => {
  let prismaMock: {
    subscriptionFlow: {
      [method in keyof PrismaClient['subscriptionFlow']]?: jest.Mock;
    };
    subscriptionInterval: {
      [method in keyof PrismaClient['subscriptionInterval']]?: jest.Mock;
    };
  };

  beforeEach(async () => {
    await nock.disableNetConnect();

    prismaMock = {
      subscriptionFlow: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      subscriptionInterval: {
        findMany: jest.fn(),
      },
    } as any;
  });

  afterEach(async () => {
    await nock.cleanAll();
    await nock.enableNetConnect();
  });

  it('gets actions for custom subscription flow', async () => {
    const mockFlows = [
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.monthly, PaymentPeriodicity.yearly],
        autoRenewal: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'default-interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { externalMailTemplateId: 'default-SUBSCRIBE' },
          },
        ],
        paymentMethods: [],
      },
      {
        id: 'custom-flow-1',
        default: false,
        memberPlanId: 'custom-plan-1',
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { externalMailTemplateId: 'custom1-SUBSCRIBE' },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.RENEWAL_SUCCESS,
            daysAwayFromEnding: null,
            mailTemplate: { externalMailTemplateId: 'custom1-RENEWAL_SUCCESS' },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              externalMailTemplateId: 'custom1-INVOICE_CREATION',
            },
          },
        ],
        paymentMethods: [{ id: 'stripe', name: 'Stripe' }],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    const actions = await sed.getActionsForSubscriptions({
      memberplanId: 'custom-plan-1',
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
    });

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(
      actions.find(a => a.type === SubscriptionEvent.SUBSCRIBE)
    ).toBeDefined();
    expect(
      actions.find(a => a.type === SubscriptionEvent.RENEWAL_SUCCESS)
    ).toBeDefined();
    const subscribeAction = actions.find(
      a => a.type === SubscriptionEvent.SUBSCRIBE
    )!;
    expect(subscribeAction.externalMailTemplate).toEqual('custom1-SUBSCRIBE');
  });

  it('gets actions for default subscription flow when custom not found', async () => {
    const mockFlows = [
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [
          PaymentPeriodicity.monthly,
          PaymentPeriodicity.yearly,
          PaymentPeriodicity.biannual,
          PaymentPeriodicity.biennial,
          PaymentPeriodicity.lifetime,
        ],
        autoRenewal: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'default-interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { externalMailTemplateId: 'default-SUBSCRIBE' },
          },
          {
            id: 'default-interval-2',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
            mailTemplate: {
              externalMailTemplateId: 'default-INVOICE_CREATION',
            },
          },
        ],
        paymentMethods: [{ id: 'payrexx', name: 'Payrexx' }],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    const actions = await sed.getActionsForSubscriptions({
      memberplanId: 'custom-plan-1',
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false,
    });

    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(
      actions.find(a => a.type === SubscriptionEvent.SUBSCRIBE)
    ).toBeDefined();
    const subscribeAction = actions.find(
      a => a.type === SubscriptionEvent.SUBSCRIBE
    )!;
    expect(subscribeAction.externalMailTemplate).toEqual('default-SUBSCRIBE');
  });

  it('filters actions by daysAwayFromEnding', async () => {
    const mockFlows = [
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
      {
        id: 'custom-flow-1',
        default: false,
        memberPlanId: 'custom-plan-1',
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              externalMailTemplateId: 'custom1-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -7,
            mailTemplate: { externalMailTemplateId: 'custom1-CUSTOM2' },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -10,
            mailTemplate: { externalMailTemplateId: 'custom1-CUSTOM1' },
          },
        ],
        paymentMethods: [{ id: 'stripe', name: 'Stripe' }],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    const actions = await sed.getActionsForSubscriptions({
      memberplanId: 'custom-plan-1',
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
      daysAwayFromEnding: -7,
    });

    expect(actions).toHaveLength(2);
    expect(actions[0].daysAwayFromEnding).toEqual(-7);
    expect(actions[1].daysAwayFromEnding).toEqual(-7);
  });

  it('gets actions for specific events', async () => {
    const mockFlows = [
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
      {
        id: 'custom-flow-1',
        default: false,
        memberPlanId: 'custom-plan-1',
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              externalMailTemplateId: 'custom1-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 7,
            mailTemplate: {
              externalMailTemplateId: 'custom1-DEACTIVATION_UNPAID',
            },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { externalMailTemplateId: 'custom1-SUBSCRIBE' },
          },
        ],
        paymentMethods: [{ id: 'stripe', name: 'Stripe' }],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    const actions = await sed.getActionsForSubscriptions({
      memberplanId: 'custom-plan-1',
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: false,
      events: [
        SubscriptionEvent.INVOICE_CREATION,
        SubscriptionEvent.DEACTIVATION_UNPAID,
      ],
    });

    expect(actions).toHaveLength(2);
    expect(actions[0].type).toEqual(SubscriptionEvent.INVOICE_CREATION);
    expect(actions[1].type).toEqual(SubscriptionEvent.DEACTIVATION_UNPAID);
  });

  it('throws error when no default flow found', async () => {
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
      {
        id: 'custom-flow-1',
        default: false,
        memberPlanId: 'custom-plan-1',
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
    ]);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    await expect(
      sed.getActionsForSubscriptions({
        memberplanId: 'custom-plan-1',
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true,
      })
    ).rejects.toThrow('Default user subscription flow not found!');
  });

  it('throws error when combining daysAwayFromEnding with events', async () => {
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
    ]);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    await expect(
      sed.getActionsForSubscriptions({
        memberplanId: 'custom-plan-1',
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true,
        daysAwayFromEnding: 10,
        events: [SubscriptionEvent.INVOICE_CREATION],
      })
    ).rejects.toThrow(
      'Its not supported to query for daysAwayFromEnding combined with an event list'
    );
  });

  it('gets earliest invoice creation date', async () => {
    const mockFlows = [
      {
        id: 'flow-1',
        default: true,
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -3,
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -1,
          },
        ],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);
    const testDate = new Date();
    const result = await sed.getEarliestInvoiceCreationDate(testDate);

    // Should return the earliest date (most negative daysAwayFromEnding)
    expect(format(result, 'dd-MM-yyyy')).toEqual(
      format(add(testDate, { days: 14 }), 'dd-MM-yyyy')
    );
  });

  it('gets dates with custom events', async () => {
    const mockFlows = [
      {
        id: 'flow-1',
        default: true,
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -90,
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -40,
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: 0,
          },
          {
            id: 'interval-4',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: 10,
          },
        ],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);
    const testDate = new Date();
    const result = await sed.getDatesWithCustomEvent(testDate);

    expect(result).toHaveLength(4);
    const dateStrings = result.map(r => format(r, 'dd-MM-yyyy'));

    expect(dateStrings).toContain(
      format(sub(testDate, { days: -90 }), 'dd-MM-yyyy')
    );
    expect(dateStrings).toContain(
      format(sub(testDate, { days: -40 }), 'dd-MM-yyyy')
    );
    expect(dateStrings).toContain(
      format(sub(testDate, { days: 0 }), 'dd-MM-yyyy')
    );
    expect(dateStrings).toContain(
      format(sub(testDate, { days: 10 }), 'dd-MM-yyyy')
    );
  });

  it('returns empty array when no custom events found', async () => {
    const mockFlows = [
      {
        id: 'flow-1',
        default: true,
        intervals: [],
      },
    ];

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue(mockFlows);

    const sed = new SubscriptionEventDictionary(prismaMock as any);
    const testDate = new Date();
    const result = await sed.getDatesWithCustomEvent(testDate);

    expect(result).toHaveLength(0);
  });

  it('handles flows with no memberplan correctly', async () => {
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
      {
        id: 'flow-no-plan',
        default: false,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.monthly],
        autoRenewal: [true],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [],
        paymentMethods: [],
      },
    ]);

    const sed = new SubscriptionEventDictionary(prismaMock as any);

    await expect(
      sed.getActionsForSubscriptions({
        memberplanId: 'custom-plan-1',
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true,
      })
    ).rejects.toThrow(
      'Subscription Flow with no memberplan found that is not default! This is a data integrity error!'
    );
  });
});
