import { Test, TestingModule } from '@nestjs/testing';
import {
  MailChannel,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { SubscriptionFlowService } from './subscription-flow.service';
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

      await expect(createCustomMailAt(-26)).rejects.toThrow(
        /-25.*monthly/
      );
      await expect(createCustomMailAt(-25)).resolves.toBeDefined();
    });

    it('still refuses a day later than 90 days after the end', async () => {
      prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
        flowFor([PaymentPeriodicity.yearly])
      );

      await expect(createCustomMailAt(91)).rejects.toThrow(
        BadRequestException
      );
    });

    describe('of the default flow', () => {
      beforeEach(() => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
          flowFor([], true)
        );
      });

      it('follows what the active member plans offer', async () => {
        prismaMock.memberPlan.findMany!.mockResolvedValue([
          plan('Jahresabo', PaymentPeriodicity.yearly),
        ]);

        await expect(createCustomMailAt(-38)).resolves.toBeDefined();

        prismaMock.memberPlan.findMany!.mockResolvedValue([
          plan('Jahresabo', PaymentPeriodicity.yearly),
          plan('Monatsabo', PaymentPeriodicity.monthly),
        ]);

        await expect(createCustomMailAt(-38)).rejects.toThrow(/-25.*monthly/);
        expect(prismaMock.memberPlan.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { active: true } })
        );
      });

      it('follows the running subscriptions no other flow takes', async () => {
        prismaMock.memberPlan.findMany!.mockResolvedValue([
          plan('Jahresabo', PaymentPeriodicity.yearly),
        ]);
        prismaMock.subscriptionFlow.findMany!.mockResolvedValue([
          {
            ...flowFor([PaymentPeriodicity.quarterly]),
            id: 'flow-2',
            paymentMethods: [{ id: 'payment-1' }],
          },
        ]);
        subscriptionGroupBy.mockResolvedValue([
          { paymentPeriodicity: PaymentPeriodicity.monthly },
        ]);

        await expect(createCustomMailAt(-38)).rejects.toThrow(/-25.*monthly/);
        expect(subscriptionGroupBy).toHaveBeenCalledWith(
          expect.objectContaining({
            by: ['paymentPeriodicity'],
            where: {
              deactivation: null,
              NOT: {
                OR: [
                  expect.objectContaining({
                    memberPlanID: 'plan-1',
                    paymentPeriodicity: { in: [PaymentPeriodicity.quarterly] },
                  }),
                ],
              },
            },
          })
        );
      });

      it('names the plans that offer its shortest periodicity', async () => {
        prismaMock.memberPlan.findMany!.mockResolvedValue([
          plan(
            'Flexabo',
            PaymentPeriodicity.yearly,
            PaymentPeriodicity.monthly
          ),
          plan('Jahresabo', PaymentPeriodicity.yearly),
        ]);

        await expect(service.earliestDay(flowFor([], true))).resolves.toEqual({
          days: -25,
          periodicity: PaymentPeriodicity.monthly,
          memberPlans: ['Flexabo'],
        });
      });

      it('is as careful as for monthly while nothing is offered yet', async () => {
        await expect(service.earliestDay(flowFor([], true))).resolves.toEqual({
          days: -25,
          periodicity: null,
          memberPlans: [],
        });
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
        memberPlans: [],
      });
    });

    describe('with an event that is already too early', () => {
      beforeEach(() => {
        prismaMock.subscriptionFlow.findUnique!.mockResolvedValue(
          flowFor([PaymentPeriodicity.monthly])
        );
        prismaMock.subscriptionInterval.findUnique!.mockResolvedValue(
          invoiceCreation(-38)
        );
      });

      it('still lets its template change', async () => {
        await expect(
          service.updateInterval({ id: 'interval-1', mailTemplateId: 'mail-2' })
        ).resolves.toBeDefined();
      });

      it('still lets it be saved on the day it has', async () => {
        await expect(
          service.updateInterval({ id: 'interval-1', daysAwayFromEnding: -38 })
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
          periodicities: [PaymentPeriodicity.yearly, PaymentPeriodicity.monthly],
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
