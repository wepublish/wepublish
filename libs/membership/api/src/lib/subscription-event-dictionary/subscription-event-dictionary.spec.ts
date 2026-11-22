import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { add, format, sub } from 'date-fns';

import nock from 'nock';
import { SubscriptionEventDictionary } from './subscription-event-dictionary';
import type { Mock } from 'vitest';

describe('SubscriptionEventDictionary', () => {
  let prismaMock: {
    subscriptionFlow: {
      [method in keyof PrismaClient['subscriptionFlow']]?: Mock;
    };
    subscriptionInterval: {
      [method in keyof PrismaClient['subscriptionInterval']]?: Mock;
    };
  };

  beforeEach(async () => {
    await nock.disableNetConnect();

    prismaMock = {
      subscriptionFlow: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      subscriptionInterval: {
        findMany: vi.fn(),
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
        legacy: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'default-interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { id: 'default-SUBSCRIBE' },
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
        legacy: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { id: 'custom1-SUBSCRIBE' },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.RENEWAL_SUCCESS,
            daysAwayFromEnding: null,
            mailTemplate: { id: 'custom1-RENEWAL_SUCCESS' },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              id: 'custom1-INVOICE_CREATION',
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
      legacy: false,
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
    expect(subscribeAction.mailTemplateId).toEqual('custom1-SUBSCRIBE');
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
        legacy: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'default-interval-1',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { id: 'default-SUBSCRIBE' },
          },
          {
            id: 'default-interval-2',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
            mailTemplate: {
              id: 'default-INVOICE_CREATION',
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
      legacy: false,
    });

    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(
      actions.find(a => a.type === SubscriptionEvent.SUBSCRIBE)
    ).toBeDefined();
    const subscribeAction = actions.find(
      a => a.type === SubscriptionEvent.SUBSCRIBE
    )!;
    expect(subscribeAction.mailTemplateId).toEqual('default-SUBSCRIBE');
  });

  it('filters actions by daysAwayFromEnding', async () => {
    const mockFlows = [
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
        legacy: [true, false],
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
        legacy: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              id: 'custom1-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -7,
            mailTemplate: { id: 'custom1-CUSTOM2' },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -10,
            mailTemplate: { id: 'custom1-CUSTOM1' },
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
      legacy: false,
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
        legacy: [true, false],
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
        legacy: [true, false],
        createdAt: new Date(),
        modifiedAt: new Date(),
        intervals: [
          {
            id: 'interval-1',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -7,
            mailTemplate: {
              id: 'custom1-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-2',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 7,
            mailTemplate: {
              id: 'custom1-DEACTIVATION_UNPAID',
            },
          },
          {
            id: 'interval-3',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: { id: 'custom1-SUBSCRIBE' },
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
      legacy: false,
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
        legacy: [true, false],
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
        legacy: false,
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
        legacy: [true, false],
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
        legacy: false,
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
        legacy: [true, false],
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
        legacy: [true, false],
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
        legacy: false,
      })
    ).rejects.toThrow(
      'Subscription Flow with no memberplan found that is not default! This is a data integrity error!'
    );
  });

  // Plan flow first, then a flow for all plans, then the default flow.
  describe('a flow for all member plans', () => {
    const flow = (overrides: Record<string, unknown>) => ({
      id: 'flow',
      default: false,
      allMemberPlans: false,
      memberPlanId: null,
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [true],
      legacy: [true, false],
      createdAt: new Date(),
      modifiedAt: new Date(),
      paymentMethods: [{ id: 'payrexx' }],
      ...overrides,
      intervals: [
        {
          id: `${overrides.id}-subscribe`,
          event: SubscriptionEvent.SUBSCRIBE,
          daysAwayFromEnding: null,
          mailTemplate: { id: `${overrides.id}-SUBSCRIBE` },
          sendAsLetter: false,
        },
      ],
    });

    const defaultFlow = flow({ id: 'default', default: true });
    const allPlansYearly = flow({ id: 'all-plans', allMemberPlans: true });
    const planYearly = flow({ id: 'plan', memberPlanId: 'plan-1' });

    const templateFor = async (
      flows: unknown[],
      query: Partial<{ memberplanId: string; periodicity: PaymentPeriodicity }>
    ) => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue(flows);

      const actions = await new SubscriptionEventDictionary(
        prismaMock as any
      ).getActionsForSubscriptions({
        memberplanId: 'plan-2',
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'payrexx',
        autorenwal: true,
        legacy: false,
        events: [SubscriptionEvent.SUBSCRIBE],
        ...query,
      });

      return actions[0]?.mailTemplateId;
    };

    it('takes the matching subscriptions of a plan that has no flow for them', async () => {
      await expect(
        templateFor([defaultFlow, planYearly, allPlansYearly], {})
      ).resolves.toBe('all-plans-SUBSCRIBE');
    });

    it('leaves a subscription to the flow of its own plan', async () => {
      await expect(
        templateFor([defaultFlow, allPlansYearly, planYearly], {
          memberplanId: 'plan-1',
        })
      ).resolves.toBe('plan-SUBSCRIBE');
    });

    it('leaves what its conditions do not match to the default flow', async () => {
      await expect(
        templateFor([defaultFlow, allPlansYearly], {
          periodicity: PaymentPeriodicity.monthly,
        })
      ).resolves.toBe('default-SUBSCRIBE');
    });

    it('takes any payment method and renewal where those are left open', async () => {
      const anyYearly = flow({
        id: 'any-yearly',
        allMemberPlans: true,
        paymentMethods: [],
        autoRenewal: [],
      });
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        defaultFlow,
        anyYearly,
      ]);

      const actions = await new SubscriptionEventDictionary(
        prismaMock as any
      ).getActionsForSubscriptions({
        memberplanId: 'plan-2',
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: false,
        legacy: false,
        events: [SubscriptionEvent.SUBSCRIBE],
      });

      expect(actions[0].mailTemplateId).toBe('any-yearly-SUBSCRIBE');
    });

    it('does not read an open condition of a member plan flow as any', async () => {
      await expect(
        templateFor(
          [
            defaultFlow,
            flow({ id: 'plan', memberPlanId: 'plan-2', paymentMethods: [] }),
          ],
          {}
        )
      ).resolves.toBe('default-SUBSCRIBE');
    });

    // A switched-off flow passes its subscriptions to the next one.
    it('skips an inactive flow', async () => {
      await expect(
        templateFor(
          [
            defaultFlow,
            { ...planYearly, active: false },
            { ...allPlansYearly, active: false },
          ],
          { memberplanId: 'plan-1' }
        )
      ).resolves.toBe('default-SUBSCRIBE');
    });

    it('looks up the template of an event in the same order', async () => {
      prismaMock.subscriptionFlow
        .findFirst!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(allPlansYearly);

      await expect(
        new SubscriptionEventDictionary(
          prismaMock as any
        ).getSubscriptionTemplateAction(
          {
            memberPlanID: 'plan-2',
            paymentMethodID: 'payrexx',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            autoRenew: true,
          } as any,
          SubscriptionEvent.SUBSCRIBE
        )
      ).resolves.toEqual({
        mailTemplateId: 'all-plans-SUBSCRIBE',
        sendAsLetter: false,
      });

      const [planLookup, allPlansLookup] =
        prismaMock.subscriptionFlow.findFirst!.mock.calls.map(
          ([args]) => args.where
        );

      expect(planLookup).toMatchObject({
        default: false,
        active: true,
        allMemberPlans: false,
        memberPlan: { id: 'plan-2' },
      });
      // Each condition: left open, or it has the subscription's value. Whom
      // the flow is for is never left open.
      expect(allPlansLookup).toEqual({
        default: false,
        active: true,
        allMemberPlans: true,
        legacy: { has: false },
        AND: [
          {
            OR: [
              { autoRenewal: { isEmpty: true } },
              { autoRenewal: { has: true } },
            ],
          },
          {
            OR: [
              { periodicities: { isEmpty: true } },
              { periodicities: { has: PaymentPeriodicity.yearly } },
            ],
          },
          {
            OR: [
              { paymentMethods: { none: {} } },
              { paymentMethods: { some: { id: 'payrexx' } } },
            ],
          },
        ],
      });
    });
  });

  describe('letter switch', () => {
    const defaultFlow = {
      id: 'default-flow',
      default: true,
      memberPlanId: null,
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true, false],
      legacy: [true, false],
      createdAt: new Date(),
      modifiedAt: new Date(),
      intervals: [
        {
          id: 'default-interval-1',
          event: SubscriptionEvent.SUBSCRIBE,
          daysAwayFromEnding: null,
          mailTemplate: { id: 'default-SUBSCRIBE' },
          sendAsLetter: true,
        },
        {
          id: 'default-interval-2',
          event: SubscriptionEvent.INVOICE_CREATION,
          daysAwayFromEnding: -14,
          mailTemplate: { id: 'default-INVOICE_CREATION' },
          sendAsLetter: false,
        },
      ],
      paymentMethods: [{ id: 'payrexx', name: 'Payrexx' }],
    };

    const subscription = {
      memberPlanID: 'plan-1',
      paymentMethodID: 'payrexx',
      paymentPeriodicity: PaymentPeriodicity.monthly,
      autoRenew: true,
    } as any;

    it('carries the letter switch of each interval', async () => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([defaultFlow]);

      const actions = await new SubscriptionEventDictionary(
        prismaMock as any
      ).getActionsForSubscriptions({
        memberplanId: 'plan-1',
        periodicity: PaymentPeriodicity.monthly,
        paymentMethodId: 'payrexx',
        autorenwal: true,
        legacy: false,
        events: [
          SubscriptionEvent.SUBSCRIBE,
          SubscriptionEvent.INVOICE_CREATION,
        ],
      });

      expect(
        actions.find(a => a.type === SubscriptionEvent.SUBSCRIBE)?.sendAsLetter
      ).toBe(true);
      expect(
        actions.find(a => a.type === SubscriptionEvent.INVOICE_CREATION)
          ?.sendAsLetter
      ).toBe(false);
    });

    it('tells which template an event uses and whether it prints', async () => {
      prismaMock.subscriptionFlow
        .findFirst!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...defaultFlow,
          intervals: [defaultFlow.intervals[0]],
        });

      await expect(
        new SubscriptionEventDictionary(
          prismaMock as any
        ).getSubscriptionTemplateAction(
          subscription,
          SubscriptionEvent.SUBSCRIBE
        )
      ).resolves.toEqual({
        mailTemplateId: 'default-SUBSCRIBE',
        sendAsLetter: true,
      });
    });

    it('has no action for an event without a template', async () => {
      prismaMock.subscriptionFlow.findFirst!.mockResolvedValue({
        ...defaultFlow,
        intervals: [{ ...defaultFlow.intervals[0], mailTemplate: null }],
      });

      await expect(
        new SubscriptionEventDictionary(
          prismaMock as any
        ).getSubscriptionTemplateAction(
          subscription,
          SubscriptionEvent.SUBSCRIBE
        )
      ).resolves.toBeUndefined();
    });
  });
});
