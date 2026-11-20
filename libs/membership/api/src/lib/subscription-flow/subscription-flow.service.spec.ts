import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { SubscriptionFlowService } from './subscription-flow.service';
import { BadRequestException } from '@nestjs/common';
import type { Mock } from 'vitest';
import { FeaturesService } from '@wepublish/features/api';

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

  const features = { isEnabled: vi.fn(async (_key: string) => false) };

  beforeEach(async () => {
    features.isEnabled.mockReset().mockResolvedValue(false);

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
    } as any;

    // Add transaction method separately
    (prismaMock as any).$transaction = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionFlowService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: FeaturesService, useValue: features },
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

  describe('legacy subscriptions', () => {
    const input = {
      memberPlanId: mockMemberPlan.id,
      paymentMethodIds: [mockPaymentMethod.id],
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
    };
    const existing = (legacy: boolean[]) => ({
      id: 'existing-flow',
      paymentMethods: [{ id: mockPaymentMethod.id }],
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      legacy,
    });
    const withFeature = () =>
      features.isEnabled.mockImplementation(
        async key => key === 'legacy-subscriptions'
      );

    it('makes a new flow apply to legacy and other subscriptions alike by default', async () => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);

      await service.createFlow(input);

      expect(prismaMock.subscriptionFlow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ legacy: [true, false] }),
      });
    });

    it('stores that a flow is for legacy subscriptions only', async () => {
      withFeature();
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);

      await service.createFlow({ ...input, legacy: [true] });

      expect(prismaMock.subscriptionFlow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ legacy: [true] }),
      });
    });

    // Without the feature nobody can see or undo the split in the editor.
    it('refuses a flow for legacy subscriptions only while the feature is off', async () => {
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);

      await expect(
        service.createFlow({ ...input, legacy: [true] })
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.subscriptionFlow.create).not.toHaveBeenCalled();
    });

    it('refuses a flow that is for nobody', async () => {
      withFeature();

      await expect(
        service.createFlow({ ...input, legacy: [] })
      ).rejects.toThrow(BadRequestException);
    });

    it('lets a legacy flow sit next to the flow for all the others', async () => {
      withFeature();
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        existing([false]),
      ]);

      await expect(
        service.createFlow({ ...input, legacy: [true] })
      ).resolves.toBeDefined();
    });

    it('refuses a legacy flow that an existing flow for everybody already covers', async () => {
      withFeature();
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
        existing([true, false]),
      ]);

      await expect(
        service.createFlow({ ...input, legacy: [true] })
      ).rejects.toThrow('there is a filter overlap');
    });

    it('narrows an existing flow to legacy subscriptions', async () => {
      withFeature();
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue({
        id: 'flow-1',
        memberPlanId: mockMemberPlan.id,
        paymentMethods: [],
      });
      prismaMock.subscriptionFlow.findMany!.mockResolvedValue([]);
      (prismaMock as any).$transaction.mockResolvedValue([]);

      await service.updateFlow({ id: 'flow-1', legacy: [true] });

      expect(prismaMock.subscriptionFlow.update).toHaveBeenCalledWith({
        where: { id: 'flow-1' },
        data: expect.objectContaining({ legacy: [true] }),
      });
    });

    it('refuses narrowing a flow while the feature is off', async () => {
      await expect(
        service.updateFlow({ id: 'flow-1', legacy: [false] })
      ).rejects.toThrow(BadRequestException);
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

    // The flow editor updates days and template without mentioning the switch.
    it('leaves the switch alone when an update does not mention it', async () => {
      await service.updateInterval({
        id: existingInterval.id,
        daysAwayFromEnding: -5,
      });

      expect(lastUpdateData()).not.toHaveProperty('sendAsLetter');
    });
  });
});
