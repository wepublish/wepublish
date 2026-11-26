import { Test, TestingModule } from '@nestjs/testing';
import {
  MailChannel,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import {
  SubscriptionFlowService,
  subscriptionsOfFlow,
} from './subscription-flow.service';
import { BadRequestException } from '@nestjs/common';
import type { Mock } from 'vitest';

describe('SubscriptionFlowService', () => {
  let service: SubscriptionFlowService;
  let prismaMock: {
    subscriptionFlow: {
      [method in keyof PrismaClient['subscriptionFlow']]?: Mock;
    };
    subscriptionInterval: {
      [method in keyof PrismaClient['subscriptionInterval']]?: Mock;
    };
    memberPlan: { [method in keyof PrismaClient['memberPlan']]?: Mock };
    mailTemplateVariant: { findMany: Mock };
    paymentMethod: {
      [method in keyof PrismaClient['paymentMethod']]?: Mock;
    };
    mailTemplate: {
      [method in keyof PrismaClient['mailTemplate']]?: Mock;
    };
  };

  const mockMemberPlan = {
    id: 'plan-1',
    name: 'Test Plan',
    slug: 'test-plan',
    description: 'Test Description',
    active: true,
    availablePaymentMethods: [],
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockPaymentMethod = {
    id: 'payment-1',
    name: 'Test Payment',
    slug: 'test-payment',
    description: 'Test Payment Description',
    active: true,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockMailTemplate = {
    id: 'mail-1',
    name: 'Test Mail',
    description: 'Test Mail Description',
    subject: 'Test Subject',
    htmlContent: '<p>Test</p>',
    textContent: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      subscriptionFlow: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      subscriptionInterval: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      memberPlan: {
        findUnique: vi.fn(),
      },
      paymentMethod: {
        findMany: vi.fn(),
      },
      mailTemplate: {
        findUnique: vi.fn(),
      },
      // Every template is written for both channels unless a test says otherwise.
      mailTemplateVariant: {
        findMany: vi.fn(async () => [
          { channel: MailChannel.mail },
          { channel: MailChannel.letter },
        ]),
      },
    } as any;

    // Add transaction method separately
    (prismaMock as any).$transaction = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionFlowService,
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SubscriptionFlowService>(SubscriptionFlowService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns only default flow', async () => {
    const defaultFlow = {
      id: 'flow-1',
      default: true,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [
        {
          id: 'interval-1',
          event: SubscriptionEvent.INVOICE_CREATION,
          mailTemplateId: 'mail-1',
          daysAwayFromEnding: null,
          subscriptionFlowId: 'flow-1',
        },
      ],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([defaultFlow]);

    const result = await service.getFlows(true);
    expect(result.length).toEqual(1);
    expect(result[0].default).toEqual(true);
    expect(result[0].id).toEqual(defaultFlow.id);
  });

  it('returns all flows with default first', async () => {
    const defaultFlow = {
      id: 'flow-1',
      default: true,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const customFlow = {
      id: 'flow-2',
      default: false,
      memberPlanId: 'plan-2',
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [false],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
      defaultFlow,
      customFlow,
    ]);

    const result = await service.getFlows(false);
    expect(result.length).toEqual(2);
    expect(result[0].default).toEqual(true);
    expect(result[0].id).toEqual(defaultFlow.id);
    expect(result[1].default).toEqual(false);
    expect(result[1].id).toEqual(customFlow.id);
  });

  it('prevents deletion of nonexistent flow', async () => {
    prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(null);

    const t = async () => {
      await service.deleteFlow('ba5add58-3c64-443c-87f9-7480a4b03a5c');
    };

    expect(t).rejects.toThrow(Error);
  });

  it('prevents deletion of default flow', async () => {
    const defaultFlow = {
      id: 'flow-1',
      default: true,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(defaultFlow);

    const t = async () => {
      await service.deleteFlow(defaultFlow.id);
    };

    expect(t).rejects.toThrow(Error);
  });

  it('creates a flow', async () => {
    const createdFlow = {
      id: 'flow-1',
      default: false,
      memberPlanId: mockMemberPlan.id,
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [
        {
          id: 'interval-1',
          event: SubscriptionEvent.SUBSCRIBE,
          mailTemplateId: 'mail-1',
          daysAwayFromEnding: null,
          subscriptionFlowId: 'flow-1',
        },
        {
          id: 'interval-2',
          event: SubscriptionEvent.INVOICE_CREATION,
          mailTemplateId: 'mail-1',
          daysAwayFromEnding: null,
          subscriptionFlowId: 'flow-1',
        },
      ],
      paymentMethods: [mockPaymentMethod],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionFlow.count!.mockResolvedValue(0);
    // First call is for filterHasOverlap check, second call is for getFlows after creation
    prismaMock.subscriptionFlow
      .findMany!.mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdFlow]);
    prismaMock.memberPlan.findUnique!.mockResolvedValue(mockMemberPlan);
    prismaMock.paymentMethod.findMany!.mockResolvedValue([mockPaymentMethod]);
    prismaMock.subscriptionFlow.create!.mockResolvedValue(createdFlow);

    const result = await service.createFlow({
      memberPlanId: mockMemberPlan.id,
      paymentMethodIds: [mockPaymentMethod.id],
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
    });

    expect(result.length).toEqual(1);
    expect(result[0].memberPlanId).toEqual(mockMemberPlan.id);
    expect(result[0].intervals.length).toEqual(2);
  });

  // A subscription must fall into one flow of its plan only.
  describe('two flows of a plan that would take the same subscription', () => {
    const yearlyFlow = {
      id: 'flow-yearly',
      paymentMethods: [{ id: mockPaymentMethod.id }],
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [true],
    };

    beforeEach(() => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([yearlyFlow]);
    });

    it('refuses a new flow for monthly and yearly next to one for yearly', async () => {
      await expect(
        service.createFlow({
          memberPlanId: mockMemberPlan.id,
          paymentMethodIds: [mockPaymentMethod.id],
          periodicities: [
            PaymentPeriodicity.monthly,
            PaymentPeriodicity.yearly,
          ],
          autoRenewal: [true],
        })
      ).rejects.toThrow(/overlap/);
      expect(prismaMock.subscriptionFlow.create).not.toHaveBeenCalled();
      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            active: true,
            memberPlan: { id: mockMemberPlan.id },
            allMemberPlans: false,
          },
        })
      );
    });

    it('refuses to add yearly to another flow of the plan', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
        id: 'flow-monthly',
        default: false,
        active: true,
        memberPlanId: mockMemberPlan.id,
        paymentMethods: [{ id: mockPaymentMethod.id }],
        periodicities: [PaymentPeriodicity.monthly],
        autoRenewal: [true],
      });

      await expect(
        service.updateFlow({
          id: 'flow-monthly',
          paymentMethodIds: [mockPaymentMethod.id],
          periodicities: [
            PaymentPeriodicity.monthly,
            PaymentPeriodicity.yearly,
          ],
          autoRenewal: [true],
        })
      ).rejects.toThrow(/overlap/);
    });

    it('takes a flow that differs in the payment method', async () => {
      prismaMock.subscriptionFlow.create!.mockResolvedValue({});

      await expect(
        service.createFlow({
          memberPlanId: mockMemberPlan.id,
          paymentMethodIds: ['another-payment-method'],
          periodicities: [
            PaymentPeriodicity.monthly,
            PaymentPeriodicity.yearly,
          ],
          autoRenewal: [true],
        })
      ).resolves.toBeDefined();
    });
  });

  describe('a flow for all member plans', () => {
    const allPlansInput = {
      allMemberPlans: true,
      paymentMethodIds: [mockPaymentMethod.id],
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [true],
    };

    beforeEach(() => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
      prismaMock.subscriptionFlow.create!.mockResolvedValue({});
    });

    it('is created without a member plan', async () => {
      await service.createFlow(allPlansInput);

      const { data } = prismaMock.subscriptionFlow.create!.mock.calls[0][0];

      expect(data).toMatchObject({ default: false, allMemberPlans: true });
      expect(data.memberPlan).toBeUndefined();
    });

    // A plan's own flow comes first, so the two never compete.
    it('is only held against the other flows for all plans', async () => {
      await service.createFlow(allPlansInput);

      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true, allMemberPlans: true },
        })
      );
    });

    it('is refused when another flow for all plans takes the same subscriptions', async () => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        {
          id: 'flow-all',
          paymentMethods: [{ id: mockPaymentMethod.id }],
          periodicities: [
            PaymentPeriodicity.yearly,
            PaymentPeriodicity.monthly,
          ],
          autoRenewal: [true],
        },
      ]);

      await expect(service.createFlow(allPlansInput)).rejects.toThrow(
        /overlap/
      );
    });

    it('must be either for one member plan or for all', async () => {
      await expect(
        service.createFlow({ ...allPlansInput, memberPlanId: 'plan-1' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createFlow({ ...allPlansInput, allMemberPlans: false })
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.subscriptionFlow.create).not.toHaveBeenCalled();
    });

    // An open condition takes any value: "all yearly subscriptions" should
    // not have to list every payment method there is or will be.
    describe('with a condition left open', () => {
      const yearlyOnly = {
        allMemberPlans: true,
        paymentMethodIds: [],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [],
      };

      const stored = (overrides: Record<string, unknown> = {}) => ({
        id: 'flow-all',
        default: false,
        allMemberPlans: true,
        memberPlanId: null,
        paymentMethods: [],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [],
        ...overrides,
      });

      it('is created', async () => {
        await expect(service.createFlow(yearlyOnly)).resolves.toBeDefined();
        expect(prismaMock.subscriptionFlow.create).toHaveBeenCalled();
      });

      it('needs at least one condition, or it would be a second default flow', async () => {
        await expect(
          service.createFlow({ ...yearlyOnly, periodicities: [] })
        ).rejects.toThrow(/at least one/);
        expect(prismaMock.subscriptionFlow.create).not.toHaveBeenCalled();
      });

      it('is refused next to a flow for all plans it shares subscriptions with: open means any', async () => {
        prismaMock.subscriptionFlow.findMany!.mockResolvedValue([stored()]);

        await expect(
          service.createFlow({
            allMemberPlans: true,
            paymentMethodIds: [mockPaymentMethod.id],
            periodicities: [PaymentPeriodicity.yearly],
            autoRenewal: [true],
          })
        ).rejects.toThrow(/overlap/);
      });

      it('stands next to a flow for all plans for other subscriptions', async () => {
        prismaMock.subscriptionFlow.findMany!.mockResolvedValue([stored()]);

        await expect(
          service.createFlow({
            ...yearlyOnly,
            periodicities: [PaymentPeriodicity.monthly],
          })
        ).resolves.toBeDefined();
      });

      it('cannot have its last condition taken away', async () => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(stored());

        await expect(
          service.updateFlow({
            id: 'flow-all',
            paymentMethodIds: [],
            periodicities: [],
            autoRenewal: [],
          })
        ).rejects.toThrow(/at least one/);
      });

      it('can have a condition opened while another stays', async () => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
          stored({ autoRenewal: [true] })
        );
        prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
        (prismaMock as any).$transaction.mockResolvedValue([]);

        await expect(
          service.updateFlow({
            id: 'flow-all',
            paymentMethodIds: [],
            periodicities: [PaymentPeriodicity.yearly],
            autoRenewal: [],
          })
        ).resolves.toBeDefined();
      });

      it('matches subscriptions by the conditions it has only', () => {
        expect(subscriptionsOfFlow(stored())).toEqual({
          memberPlanID: undefined,
          paymentPeriodicity: { in: [PaymentPeriodicity.yearly] },
        });
      });

      // Any term includes the shortest.
      it('may act 25 days ahead at the earliest while its term is open', async () => {
        await expect(
          service.earliestDay(
            stored({ periodicities: [], autoRenewal: [true] })
          )
        ).resolves.toEqual({ days: -25, periodicity: null });
      });
    });

    it('a flow of a member plan still needs all three conditions', async () => {
      await expect(
        service.createFlow({
          memberPlanId: mockMemberPlan.id,
          paymentMethodIds: [],
          periodicities: [PaymentPeriodicity.yearly],
          autoRenewal: [true],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('is held against the flows for all plans when its conditions change', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
        id: 'flow-all',
        default: false,
        allMemberPlans: true,
        active: true,
        memberPlanId: null,
        paymentMethods: [{ id: mockPaymentMethod.id }],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
      });
      prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
      (prismaMock as any).$transaction.mockResolvedValue([]);

      await service.updateFlow({ id: 'flow-all', ...allPlansInput });

      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true, allMemberPlans: true },
        })
      );
    });
  });

  // Who a flow still sends to: running subscriptions, and ended ones whose
  // end lies within the flow's latest day. Each subscription in one flow only.
  describe('counting the subscriptions a flow handles', () => {
    const today = new Date('2026-11-20T10:00:00Z');
    let count: Mock;

    const flow = (overrides: Record<string, unknown> = {}) => ({
      id: 'flow-plan',
      default: false,
      allMemberPlans: false,
      active: true,
      memberPlanId: 'plan-1',
      paymentMethods: [{ id: 'payment-1' }],
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [true],
      intervals: [{ daysAwayFromEnding: -14 }, { daysAwayFromEnding: 5 }],
      ...overrides,
    });

    const where = () => count.mock.calls[0][0].where.AND as unknown[];

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(today);
      count = vi.fn(async () => 4);
      (prismaMock as any).subscription = { count };
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
    });

    afterEach(() => vi.useRealTimers());

    it('counts running subscriptions and those ended within the latest day of the flow', async () => {
      await expect(service.countSubscriptions(flow())).resolves.toBe(4);

      expect(where()[0]).toEqual({
        OR: [
          { deactivation: null },
          { paidUntil: { gte: new Date('2026-11-15T00:00:00.000Z') } },
        ],
      });
    });

    it('does not reach into the past for a flow whose last event lies before the end', async () => {
      await service.countSubscriptions(
        flow({ intervals: [{ daysAwayFromEnding: -14 }] })
      );

      expect(where()[0]).toEqual({
        OR: [
          { deactivation: null },
          { paidUntil: { gte: new Date('2026-11-20T00:00:00.000Z') } },
        ],
      });
    });

    it('counts what the conditions of a member plan flow match', async () => {
      await service.countSubscriptions(flow());

      expect(where()).toContainEqual(subscriptionsOfFlow(flow() as any));
      expect(prismaMock.subscriptionFlow.findMany).not.toHaveBeenCalled();
    });

    it('leaves out of a flow for all plans what an active plan flow takes first', async () => {
      const planFlow = flow();
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([planFlow]);

      await service.countSubscriptions(
        flow({ id: 'flow-all', allMemberPlans: true, memberPlanId: null })
      );

      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          default: false,
          allMemberPlans: false,
          NOT: { id: 'flow-all' },
        },
        include: { paymentMethods: true },
      });
      expect(where()).toContainEqual({
        NOT: { OR: [subscriptionsOfFlow(planFlow as any)] },
      });
    });

    it('leaves out of the default flow what any other active flow takes', async () => {
      await service.countSubscriptions(
        flow({ id: 'flow-default', default: true, memberPlanId: null })
      );

      expect(
        prismaMock.subscriptionFlow.findMany!.mock.calls[0][0].where
      ).toEqual({ active: true, default: false, NOT: { id: 'flow-default' } });
    });

    // Prisma 7 drops an empty OR inside an AND/OR list, which would let such a
    // flow take every subscription of its plan from the default flow.
    it('lets a plan flow without an auto-renewal value take no subscription from the default flow', async () => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        flow({ autoRenewal: [] }),
      ]);

      await service.countSubscriptions(
        flow({ id: 'flow-default', default: true, memberPlanId: null })
      );

      expect(where()).toContainEqual({
        NOT: {
          OR: [
            {
              memberPlanID: 'plan-1',
              paymentMethodID: { in: ['payment-1'] },
              paymentPeriodicity: { in: [PaymentPeriodicity.yearly] },
              id: { in: [] },
            },
          ],
        },
      });
    });

    it('leaves an ended subscription uncounted that an earlier-ending flow takes, though the default flow would still message it', async () => {
      // As on review02: the flow for all plans ends 5 days after the end,
      // the default flow 90. A subscription ended 44 days ago is the other
      // flow's, which has nothing left for it, so neither flow counts it.
      const allPlansFlow = flow({
        id: 'flow-all',
        allMemberPlans: true,
        memberPlanId: null,
        paymentMethods: [],
        periodicities: [],
      });
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([allPlansFlow]);

      await service.countSubscriptions(
        flow({
          id: 'flow-default',
          default: true,
          memberPlanId: null,
          intervals: [{ daysAwayFromEnding: 90 }],
        })
      );

      expect(where()).toEqual([
        {
          OR: [
            { deactivation: null },
            { paidUntil: { gte: new Date('2026-08-22T00:00:00.000Z') } },
          ],
        },
        // By conditions only: the other flow's own 5 days play no part.
        { NOT: { OR: [subscriptionsOfFlow(allPlansFlow as any)] } },
      ]);
    });

    it('narrows to what the list is filtered by', async () => {
      await service.countSubscriptions(flow(), {
        memberPlanIds: ['plan-1', 'plan-2'],
        paymentMethodIds: ['payment-1'],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [false],
      });

      expect(where()).toEqual(
        expect.arrayContaining([
          { memberPlanID: { in: ['plan-1', 'plan-2'] } },
          { paymentMethodID: { in: ['payment-1'] } },
          { paymentPeriodicity: { in: [PaymentPeriodicity.yearly] } },
          // A yes/no field cannot be asked for `in`.
          { OR: [{ autoRenew: false }] },
        ])
      );
    });

    it('counts nothing for an inactive flow, unless asked what it would take', async () => {
      await expect(
        service.countSubscriptions(flow({ active: false }))
      ).resolves.toBe(0);
      expect(count).not.toHaveBeenCalled();

      await expect(
        service.countSubscriptions(
          flow({ active: false }),
          {},
          { ifActive: true }
        )
      ).resolves.toBe(4);
    });
  });

  it('tells how many subscriptions a flow would handle, whether it is on or off', async () => {
    prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
      id: 'flow-2',
      default: false,
      active: false,
    });
    const countSubscriptions = vi
      .spyOn(service, 'countSubscriptions')
      .mockResolvedValue(9);

    await expect(service.handledCount('flow-2')).resolves.toBe(9);
    expect(countSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'flow-2' }),
      {},
      { ifActive: true }
    );
    expect(prismaMock.subscriptionFlow.findUnique).toHaveBeenCalledWith({
      where: { id: 'flow-2' },
      include: { paymentMethods: true, intervals: true },
    });
  });

  describe('switching a flow on and off', () => {
    const stored = (overrides: Record<string, unknown> = {}) => ({
      id: 'flow-2',
      default: false,
      allMemberPlans: false,
      active: true,
      memberPlanId: mockMemberPlan.id,
      paymentMethods: [{ id: mockPaymentMethod.id }],
      periodicities: [PaymentPeriodicity.yearly],
      autoRenewal: [true],
      ...overrides,
    });

    beforeEach(() => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
      prismaMock.subscriptionFlow.update!.mockResolvedValue({});
    });

    it('switches a flow off', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(stored());

      await service.setFlowActive('flow-2', false);

      expect(prismaMock.subscriptionFlow.update).toHaveBeenCalledWith({
        where: { id: 'flow-2' },
        data: { active: false },
      });
    });

    it('never switches the default flow off: every subscription falls back to it', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        stored({ default: true, memberPlanId: null })
      );

      await expect(service.setFlowActive('flow-2', false)).rejects.toThrow(
        BadRequestException
      );
      expect(prismaMock.subscriptionFlow.update).not.toHaveBeenCalled();
    });

    it('refuses to switch a flow on that would share subscriptions with an active one', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        stored({ active: false })
      );
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        stored({ id: 'flow-1' }),
      ]);

      await expect(service.setFlowActive('flow-2', true)).rejects.toThrow(
        /overlap/
      );
      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('holds a new or changed flow only against the active flows', async () => {
      prismaMock.subscriptionFlow.create!.mockResolvedValue({});

      await service.createFlow({
        memberPlanId: mockMemberPlan.id,
        paymentMethodIds: [mockPaymentMethod.id],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
      });

      expect(prismaMock.subscriptionFlow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('does not hold an inactive flow against the others when its conditions change', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        stored({ active: false })
      );
      prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
      (prismaMock as any).$transaction.mockResolvedValue([]);

      await service.updateFlow({
        id: 'flow-2',
        paymentMethodIds: [mockPaymentMethod.id],
        periodicities: [PaymentPeriodicity.yearly],
        autoRenewal: [true],
      });

      expect(prismaMock.subscriptionFlow.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });
  });

  it('prevents creation of a second default flow', async () => {
    prismaMock.subscriptionFlow.count!.mockResolvedValue(1);

    await expect(
      service.createFlow({
        memberPlanId: mockMemberPlan.id,
        paymentMethodIds: [],
        periodicities: [],
        autoRenewal: [],
      })
    ).rejects.toThrow();
  });

  it('creates intervals for an existing flow', async () => {
    const flow = {
      id: 'flow-1',
      default: false,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const createdInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.SUBSCRIBE,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: null,
      subscriptionFlowId: flow.id,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const flowWithInterval = {
      ...flow,
      intervals: [createdInterval],
    };

    prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(flow);
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([flowWithInterval]);
    prismaMock.mailTemplate.findUnique!.mockResolvedValue(mockMailTemplate);
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);
    prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
    prismaMock.subscriptionInterval.create!.mockResolvedValue(createdInterval);

    const result = await service.createInterval({
      subscriptionFlowId: flow.id,
      mailTemplateId: mockMailTemplate.id,
      event: SubscriptionEvent.SUBSCRIBE,
    });

    expect(result.length).toEqual(1);
    expect(result[0].intervals.length).toEqual(1);
    expect(result[0].intervals[0].event).toEqual(SubscriptionEvent.SUBSCRIBE);
    expect(result[0].intervals[0].subscriptionFlowId).toEqual(flow.id);
  });

  it('prevents creation of duplicate intervals for an existing flow', async () => {
    const existingInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.SUBSCRIBE,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: null,
      subscriptionFlowId: 'flow-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionInterval.findMany!.mockResolvedValue([
      existingInterval,
    ]);

    const t = async () => {
      await service.createInterval({
        subscriptionFlowId: 'flow-1',
        mailTemplateId: mockMailTemplate.id,
        event: SubscriptionEvent.SUBSCRIBE,
      });
    };

    expect(t).rejects.toThrow(BadRequestException);
  });

  it('prevents creation of invalid daysAwayFromEnding', async () => {
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);
    prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);

    const t1 = async () => {
      await service.createInterval({
        subscriptionFlowId: 'flow-1',
        mailTemplateId: mockMailTemplate.id,
        event: SubscriptionEvent.SUBSCRIBE,
        daysAwayFromEnding: 3,
      });
    };
    expect(t1).rejects.toThrow(BadRequestException);
  });

  it('updates intervals of a flow', async () => {
    const existingInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.INVOICE_CREATION,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: -3,
      subscriptionFlowId: 'flow-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const updatedInterval = {
      ...existingInterval,
      mailTemplateId: 'mail-2',
      daysAwayFromEnding: -5,
    };

    const flowWithUpdatedInterval = {
      id: 'flow-1',
      default: false,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [updatedInterval],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
      flowWithUpdatedInterval
    );
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
      flowWithUpdatedInterval,
    ]);
    prismaMock.mailTemplate.findUnique!.mockResolvedValue({
      ...mockMailTemplate,
      id: 'mail-2',
    });
    (prismaMock as any).$transaction.mockImplementation(
      async (operations: any) => {
        return await Promise.all(operations);
      }
    );
    prismaMock.subscriptionInterval.update!.mockResolvedValue(updatedInterval);

    const result = await service.updateInterval({
      id: existingInterval.id,
      mailTemplateId: 'mail-2',
      daysAwayFromEnding: -5,
    });

    expect(result.length).toEqual(1);
    expect(result[0].intervals.length).toEqual(1);
    expect(result[0].intervals[0].mailTemplateId).toEqual('mail-2');
    expect(result[0].intervals[0].daysAwayFromEnding).toEqual(-5);
  });

  it('deletes intervals for an existing flow', async () => {
    const existingInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.CUSTOM,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: 3,
      subscriptionFlowId: 'flow-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
    prismaMock.subscriptionInterval.delete!.mockResolvedValue(existingInterval);

    await service.deleteInterval(existingInterval.id);

    expect(prismaMock.subscriptionInterval.delete).toHaveBeenCalledWith({
      where: { id: existingInterval.id },
    });
  });

  it('prevents deletion of required intervals', async () => {
    const existingInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.INVOICE_CREATION,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: 3,
      subscriptionFlowId: 'flow-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
      existingInterval
    );
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(
      existingInterval
    );

    const t = async () => {
      await service.deleteInterval(existingInterval.id);
    };
    expect(t).rejects.toThrow(Error);
  });

  it('prevents deletion of nonexisting interval', async () => {
    prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(null);
    prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);

    const t = async () => {
      await service.deleteInterval('960c635f-b157-414b-a865-b3e31afd9c3f');
    };
    expect(t).rejects.toThrow(Error);
  });

  describe('SubscriptionFlowService letter switch', () => {
    const flow = {
      id: 'flow-1',
      default: false,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const existingInterval = {
      id: 'interval-1',
      event: SubscriptionEvent.INVOICE_CREATION,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding: -3,
      sendAsLetter: false,
      subscriptionFlowId: flow.id,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const lastUpdateData = () => {
      const calls = prismaMock.subscriptionInterval.update!.mock.calls;

      return calls[calls.length - 1][0].data;
    };

    beforeEach(() => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(flow);
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([flow]);
      prismaMock.mailTemplate.findUnique!.mockResolvedValue(mockMailTemplate);
      prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
        existingInterval
      );
      prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(
        existingInterval
      );
      prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
      prismaMock.subscriptionInterval.create!.mockResolvedValue(
        existingInterval
      );
      prismaMock.subscriptionInterval.update!.mockResolvedValue(
        existingInterval
      );
      (prismaMock as any).$transaction.mockImplementation(
        async (operations: any) => Promise.all(operations)
      );
    });

    it('stores whether a new interval also prints letters', async () => {
      prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);

      await service.createInterval({
        subscriptionFlowId: flow.id,
        mailTemplateId: mockMailTemplate.id,
        event: SubscriptionEvent.SUBSCRIBE,
        sendAsLetter: true,
      });

      expect(prismaMock.subscriptionInterval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sendAsLetter: true }),
        })
      );
    });

    it('switches letters on for an existing interval', async () => {
      await service.updateInterval({
        id: existingInterval.id,
        sendAsLetter: true,
      });

      expect(lastUpdateData()).toEqual(
        expect.objectContaining({ sendAsLetter: true })
      );
    });

    // The switch is sent on its own: days and template stay as they are.
    it('keeps the template when only the switch is sent', async () => {
      await service.updateInterval({
        id: existingInterval.id,
        sendAsLetter: true,
      });

      for (const [{ data }] of prismaMock.subscriptionInterval.update!.mock
        .calls) {
        expect(data).not.toHaveProperty('mailTemplate');
      }
    });

    it('takes the template off the event when told so, and the letter with it', async () => {
      prismaMock.subscriptionInterval.findUnique!.mockResolvedValue({
        ...existingInterval,
        sendAsLetter: true,
      });

      await service.updateInterval({
        id: existingInterval.id,
        daysAwayFromEnding: -3,
        mailTemplateId: null as any,
      });

      expect(lastUpdateData()).toEqual(
        expect.objectContaining({
          mailTemplate: { disconnect: true },
          sendAsLetter: false,
        })
      );
    });

    describe('a template written for one channel only', () => {
      const writtenFor = (...channels: MailChannel[]) =>
        prismaMock.mailTemplateVariant.findMany.mockResolvedValue(
          channels.map(channel => ({ channel }))
        );

      it('refuses a letter-only template for a new interval: a flow always mails', async () => {
        writtenFor(MailChannel.letter);
        prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);

        await expect(
          service.createInterval({
            subscriptionFlowId: flow.id,
            mailTemplateId: mockMailTemplate.id,
            event: SubscriptionEvent.SUBSCRIBE,
          })
        ).rejects.toThrow(/email version/);
        expect(prismaMock.subscriptionInterval.create).not.toHaveBeenCalled();
      });

      it('refuses to move an interval to a letter-only template', async () => {
        writtenFor(MailChannel.letter);

        await expect(
          service.updateInterval({
            id: existingInterval.id,
            daysAwayFromEnding: -3,
            mailTemplateId: 'letter-only',
          })
        ).rejects.toThrow(/email version/);
        expect(prismaMock.subscriptionInterval.update).not.toHaveBeenCalled();
      });

      it('refuses to switch letters on for a new interval without a letter version', async () => {
        writtenFor(MailChannel.mail);
        prismaMock.subscriptionInterval.findFirst!.mockResolvedValue(null);

        await expect(
          service.createInterval({
            subscriptionFlowId: flow.id,
            mailTemplateId: mockMailTemplate.id,
            event: SubscriptionEvent.SUBSCRIBE,
            sendAsLetter: true,
          })
        ).rejects.toThrow(/letter version/);
      });

      it('refuses to switch letters on for an interval whose template has no letter version', async () => {
        writtenFor(MailChannel.mail);

        await expect(
          service.updateInterval({
            id: existingInterval.id,
            sendAsLetter: true,
          })
        ).rejects.toThrow(/letter version/);
        expect(prismaMock.mailTemplateVariant.findMany).toHaveBeenCalledWith({
          where: { templateId: mockMailTemplate.id },
          select: { channel: true },
        });
      });

      it('switches letters off when the interval moves to a template without a letter version', async () => {
        writtenFor(MailChannel.mail);
        prismaMock.subscriptionInterval.findUnique!.mockResolvedValue({
          ...existingInterval,
          sendAsLetter: true,
        });

        await service.updateInterval({
          id: existingInterval.id,
          daysAwayFromEnding: -3,
          mailTemplateId: 'mail-only',
        });

        expect(lastUpdateData()).toEqual(
          expect.objectContaining({
            sendAsLetter: false,
            mailTemplate: { connect: { id: 'mail-only' } },
          })
        );
      });

      it('leaves letters on when the new template has a letter version too', async () => {
        prismaMock.subscriptionInterval.findUnique!.mockResolvedValue({
          ...existingInterval,
          sendAsLetter: true,
        });

        await service.updateInterval({
          id: existingInterval.id,
          daysAwayFromEnding: -3,
          mailTemplateId: 'both',
        });

        expect(lastUpdateData()).not.toHaveProperty('sendAsLetter');
      });
    });

    // The flow editor updates days and template without mentioning the switch.
    it('leaves the switch alone when an update does not mention it', async () => {
      await service.updateInterval({
        id: existingInterval.id,
        daysAwayFromEnding: -5,
      });

      expect(lastUpdateData()).not.toHaveProperty('sendAsLetter');
    });
  });
  describe('the earliest day of an event', () => {
    const flowFor = (
      periodicities: PaymentPeriodicity[],
      isDefault = false
    ) => ({
      id: 'flow-1',
      default: isDefault,
      memberPlanId: isDefault ? null : 'plan-1',
      periodicities,
      autoRenewal: isDefault ? [] : [true],
      intervals: [],
      paymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    const plan = (name: string, ...periodicities: PaymentPeriodicity[]) => ({
      name,
      availablePaymentMethods: [{ paymentPeriodicities: periodicities }],
    });

    const invoiceCreation = (daysAwayFromEnding: number) => ({
      id: 'interval-1',
      event: SubscriptionEvent.INVOICE_CREATION,
      mailTemplateId: mockMailTemplate.id,
      daysAwayFromEnding,
      sendAsLetter: false,
      subscriptionFlowId: 'flow-1',
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    const createCustomMailAt = (daysAwayFromEnding: number) =>
      service.createInterval({
        subscriptionFlowId: 'flow-1',
        mailTemplateId: mockMailTemplate.id,
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding,
      });

    let subscriptionGroupBy: Mock;

    beforeEach(() => {
      subscriptionGroupBy = vi.fn(async () => []);
      (prismaMock as any).subscription = { groupBy: subscriptionGroupBy };
      prismaMock.memberPlan.findMany = vi.fn(async () => []);
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
      prismaMock.subscriptionInterval.findMany!.mockResolvedValue([]);
      prismaMock.subscriptionInterval.create!.mockResolvedValue({});
      prismaMock.subscriptionInterval.update!.mockResolvedValue({});
    });

    it('lets a flow for yearly subscriptions act 38 days ahead', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        flowFor([PaymentPeriodicity.yearly])
      );

      await createCustomMailAt(-38);

      expect(prismaMock.subscriptionInterval.create).toHaveBeenCalled();
    });

    it('holds a flow that includes monthly subscriptions to 25 days', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        flowFor([PaymentPeriodicity.yearly, PaymentPeriodicity.monthly])
      );

      await expect(createCustomMailAt(-26)).rejects.toThrow(/-25.*monthly/);
      await expect(createCustomMailAt(-25)).resolves.toBeDefined();
    });

    it('still refuses a day later than 90 days after the end', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        flowFor([PaymentPeriodicity.yearly])
      );

      await expect(createCustomMailAt(91)).rejects.toThrow(BadRequestException);
    });

    describe('of the default flow', () => {
      beforeEach(() => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
          flowFor([], true)
        );
      });

      // It is the fallback of every subscription, the shortest included.
      it('is never earlier than 25 days, whatever the member plans offer', async () => {
        prismaMock.memberPlan.findMany!.mockResolvedValue([
          plan('Jahresabo', PaymentPeriodicity.yearly),
        ]);

        await expect(createCustomMailAt(-26)).rejects.toThrow(
          /-25.*default flow/
        );
        await expect(createCustomMailAt(-25)).resolves.toBeDefined();
      });

      it('is told without looking at member plans or subscriptions', async () => {
        await expect(service.earliestDay(flowFor([], true))).resolves.toEqual({
          days: -25,
          periodicity: null,
        });
        expect(prismaMock.memberPlan.findMany).not.toHaveBeenCalled();
        expect(subscriptionGroupBy).not.toHaveBeenCalled();
      });
    });

    it('tells a plan flow its earliest day from its own periodicities', async () => {
      await expect(
        service.earliestDay(
          flowFor([PaymentPeriodicity.yearly, PaymentPeriodicity.quarterly])
        )
      ).resolves.toEqual({
        days: -85,
        periodicity: PaymentPeriodicity.quarterly,
      });
    });

    // Nothing outside a flow can make its days wrong, so none is put up with.
    describe('with an event that is too early', () => {
      beforeEach(() => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
          flowFor([PaymentPeriodicity.monthly])
        );
        prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
          invoiceCreation(-38)
        );
      });

      it('refuses to save it on the day it has: move it first', async () => {
        await expect(
          service.updateInterval({ id: 'interval-1', mailTemplateId: 'mail-2' })
        ).rejects.toThrow(/-25.*monthly/);
        await expect(
          service.updateInterval({ id: 'interval-1', daysAwayFromEnding: -38 })
        ).rejects.toThrow(/-25.*monthly/);
      });

      it('lets it move to a day that suits', async () => {
        await expect(
          service.updateInterval({ id: 'interval-1', daysAwayFromEnding: -25 })
        ).resolves.toBeDefined();
      });

      it('refuses to move it to another day that is too early', async () => {
        await expect(
          service.updateInterval({ id: 'interval-1', daysAwayFromEnding: -30 })
        ).rejects.toThrow(/-25.*monthly/);
      });
    });

    describe('when the conditions of a flow change', () => {
      beforeEach(() => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
          ...flowFor([PaymentPeriodicity.yearly]),
          paymentMethods: [{ id: 'payment-1' }],
        });
        (prismaMock as any).$transaction.mockResolvedValue([]);
      });

      const addMonthly = () =>
        service.updateFlow({
          id: 'flow-1',
          paymentMethodIds: ['payment-1'],
          periodicities: [
            PaymentPeriodicity.yearly,
            PaymentPeriodicity.monthly,
          ],
          autoRenewal: [true],
        });

      it('refuses a shorter periodicity its events are too early for', async () => {
        prismaMock.subscriptionInterval.findMany!.mockResolvedValue([
          invoiceCreation(-38),
        ]);

        await expect(addMonthly()).rejects.toThrow(
          /INVOICE_CREATION \(-38\).*-25.*monthly/
        );
        expect((prismaMock as any).$transaction).not.toHaveBeenCalled();
      });

      it('takes a shorter periodicity its events suit', async () => {
        prismaMock.subscriptionInterval.findMany!.mockResolvedValue([
          invoiceCreation(-14),
        ]);

        await expect(addMonthly()).resolves.toBeDefined();
      });

      it('does not stand in the way of a change that shortens nothing', async () => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
          ...flowFor([PaymentPeriodicity.monthly]),
          paymentMethods: [{ id: 'payment-1' }],
        });
        prismaMock.subscriptionInterval.findMany!.mockResolvedValue([
          invoiceCreation(-38),
        ]);

        await expect(
          service.updateFlow({
            id: 'flow-1',
            paymentMethodIds: ['payment-1'],
            periodicities: [PaymentPeriodicity.monthly],
            autoRenewal: [true, false],
          })
        ).resolves.toBeDefined();
      });
    });
  });
});
