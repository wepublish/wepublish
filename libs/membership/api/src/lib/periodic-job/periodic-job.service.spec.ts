import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Currency,
  PaymentPeriodicity,
  SubscriptionEvent,
  User,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { add, set, startOfDay, sub } from 'date-fns';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';
import { SubscriptionService } from './subscription.service';
import {
  isPeriodicJobRunning,
  PeriodicJobService,
} from './periodic-job.service';
import { InvoicePaidNotifier, PaymentsService } from '@wepublish/payment/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  MailContext,
  MailProviderError,
  MailProviderRecipientError,
} from '@wepublish/mail/api';

const createMockPrisma = () => ({
  subscriptionFlow: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [
          {
            id: 'interval-subscribe',
            event: SubscriptionEvent.SUBSCRIBE,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-1',
            },
          },
          {
            id: 'interval-renewal-success',
            event: SubscriptionEvent.RENEWAL_SUCCESS,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-2',
            },
          },
          {
            id: 'interval-renewal-failed',
            event: SubscriptionEvent.RENEWAL_FAILED,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-3',
            },
          },
          {
            id: 'interval-invoice-creation',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
            mailTemplate: {
              id: 'mt-4',
            },
          },
          {
            id: 'interval-deactivation-unpaid',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 5,
            mailTemplate: {
              id: 'mt-5',
            },
          },
          {
            id: 'interval-deactivation-by-user',
            event: SubscriptionEvent.DEACTIVATION_BY_USER,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-6',
            },
          },
          {
            id: 'interval-custom',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -15,
            mailTemplate: {
              id: 'mt-7',
            },
          },
        ],
      },
    ]),
    findFirst: vi.fn(),
  },
  subscriptionInterval: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  periodicJob: {
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => ({
      id: 'job-1',
      date: data.date,
      executionTime: data.executionTime || new Date(),
      successfullyFinished: data.successfullyFinished || null,
      finishedWithError: data.finishedWithError || null,
      tries: data.tries || 1,
      error: data.error || null,
    })),
    update: vi.fn().mockImplementation(({ data }) => ({
      id: 'job-1',
      ...data,
    })),
    updateMany: vi.fn(),
    updateManyAndReturn: vi
      .fn()
      .mockImplementation(({ where, data }) => [
        { id: 'job-1', date: where.date, tries: 0, ...data },
      ]),
  },
  subscription: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  invoice: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
  mailLog: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
  },
  memberPlan: {
    create: vi.fn(),
  },
  paymentMethod: {
    create: vi.fn(),
  },
  subscriptionDeactivation: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  $transaction: vi.fn().mockImplementation(async (operations: any) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }
    return operations;
  }),
});

const createMockSubscriptionController = () => ({
  findAllOpenInvoices: vi.fn().mockResolvedValue([]),
  getActiveSubscriptionsWithoutInvoice: vi.fn().mockResolvedValue([]),
  findUnpaidDueInvoices: vi.fn().mockResolvedValue([]),
  findUnpaidScheduledForDeactivationInvoices: vi.fn().mockResolvedValue([]),
  findActiveExpiredNotAutoRenewSubscriptions: vi.fn().mockResolvedValue([]),
  createInvoice: vi.fn(),
  chargeInvoice: vi.fn(),
  deactivateSubscription: vi.fn(),
  checkInvoiceState: vi.fn(),
});

const createMockMailContext = () => ({
  mailProvider: {
    id: 'fakeMail',
    sendMail: vi.fn().mockResolvedValue(undefined),
    getTemplateUrl: vi.fn(),
    getTemplates: vi.fn(),
    name: 'FakeMail',
    sendRemoteTemplateMail: vi.fn().mockResolvedValue(undefined),
  },
  prisma: null,
  kv: null,
  jwtGenerator: vi.fn().mockResolvedValue('test-jwt-token'),
  sendComposedMail: vi.fn().mockResolvedValue({ subject: 'Test subject' }),
});

const createMockPaymentsService = () => ({
  findPaymentProviderByPaymentMethodeId: vi.fn().mockResolvedValue(null),
  getProviders: vi.fn().mockReturnValue([]),
});

const createMockInvoicePaidNotifier = () => ({
  notify: vi.fn().mockResolvedValue(undefined),
});

type FakeLock = { lost: boolean; release: () => Promise<void> };

const createDragonflyLocks = () => {
  const held = new Map<string, FakeLock>();

  return {
    held,
    lock: vi.fn(async (name: string) => {
      if (held.has(name)) {
        return false;
      }

      const lock: FakeLock = {
        lost: false,
        release: async () => {
          if (held.get(name) === lock) {
            held.delete(name);
          }
        },
      };
      held.set(name, lock);

      return lock;
    }),
    isLocked: vi.fn(async (name: string) => held.has(name)),
    dragonflyStatus: vi.fn(async () => 'reachable'),
  };
};

const createLocksWithoutDragonfly = (
  status: 'not-configured' | 'unreachable' = 'not-configured'
) => ({
  lock: vi.fn(async () => undefined),
  isLocked: vi.fn(async () => undefined),
  dragonflyStatus: vi.fn(async () => status),
});

describe('PeriodicJobService', () => {
  let service: PeriodicJobService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockSubscriptionController: ReturnType<
    typeof createMockSubscriptionController
  >;
  let mockMailContext: ReturnType<typeof createMockMailContext>;
  let mockPaymentsService: ReturnType<typeof createMockPaymentsService>;
  let mockInvoicePaidNotifier: ReturnType<typeof createMockInvoicePaidNotifier>;
  let locks: ReturnType<typeof createDragonflyLocks>;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    locks = createDragonflyLocks();
    mockSubscriptionController = createMockSubscriptionController();
    mockMailContext = createMockMailContext();
    mockPaymentsService = createMockPaymentsService();
    mockInvoicePaidNotifier = createMockInvoicePaidNotifier();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodicJobService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSubscriptionController },
        { provide: MailContext, useValue: mockMailContext },
        { provide: PaymentsService, useValue: mockPaymentsService },
        {
          provide: InvoicePaidNotifier,
          useValue: mockInvoicePaidNotifier,
        },
        { provide: KvTtlCacheService, useValue: locks },
      ],
    }).compile();

    service = module.get<PeriodicJobService>(PeriodicJobService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('create invoice', async () => {
    const mail = 'dev-mail@test.wepublish.com';
    const renewalDate = add(new Date(), { days: 13 });

    const mockSubscription = {
      id: 'sub-1',
      userID: 'user-1',
      memberPlanID: 'plan-yearly',
      paymentMethodID: 'stripe',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: renewalDate,
      autoRenew: true,
      monthlyAmount: 200,
      startsAt: sub(renewalDate, { months: 12 }),
      currency: Currency.CHF,
      user: {
        id: 'user-1',
        name: 'test user',
        email: mail,
      },
      memberPlan: {
        name: 'yearly',
        slug: 'yearly',
      },
      periods: [
        {
          startsAt: sub(renewalDate, { months: 12 }),
          endsAt: renewalDate,
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 2300,
        },
      ],
    };

    const createdInvoice = {
      id: 'inv-new',
      dueAt: renewalDate,
      mail,
      description: 'yearly renewal of subscription yearly',
      scheduledDeactivationAt: add(renewalDate, { days: 5 }),
      paidAt: null,
      canceledAt: null,
      manuallySetAsPaidByUserId: null,
      items: [
        {
          name: 'yearly',
          description: 'yearly renewal of subscription yearly',
          quantity: 1,
          amount: 2400,
        },
      ],
    };

    mockSubscriptionController.getActiveSubscriptionsWithoutInvoice.mockResolvedValue(
      [mockSubscription]
    );
    mockSubscriptionController.createInvoice.mockResolvedValue(createdInvoice);

    await service.execute();

    // Verify invoice was created
    expect(mockSubscriptionController.createInvoice).toHaveBeenCalledTimes(1);
    expect(mockSubscriptionController.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub-1' }),
      expect.any(Date)
    );

    // Verify no deactivations
    expect(
      mockSubscriptionController.deactivateSubscription
    ).not.toHaveBeenCalled();
  });

  it('charge invoice offsession', async () => {
    const mail = 'dev-mail@test.wepublish.com';
    const renewalDate = new Date();

    const mockInvoice = {
      id: 'inv-1',
      dueAt: renewalDate,
      mail,
      paidAt: null,
      canceledAt: null,
      manuallySetAsPaidByUserId: null,
      scheduledDeactivationAt: add(renewalDate, { days: 5 }),
      currency: Currency.CHF,
      items: [{ amount: 2400, quantity: 1, name: 'Yearly Sub' }],
      subscriptionPeriods: [],
      subscription: {
        id: 'sub-1',
        memberPlanID: 'plan-yearly',
        paymentMethodID: 'stripe',
        paymentPeriodicity: PaymentPeriodicity.yearly,
        paidUntil: renewalDate,
        autoRenew: true,
        monthlyAmount: 200,
        currency: Currency.CHF,
        paymentMethod: {
          id: 'stripe',
          paymentProviderID: 'stripe',
        },
        memberPlan: { name: 'yearly' },
        user: {
          id: 'user-1',
          email: mail,
          paymentProviderCustomers: [
            { paymentProviderID: 'stripe', customerID: 'testId' },
          ],
        },
      },
    };

    mockSubscriptionController.findUnpaidDueInvoices.mockResolvedValue([
      mockInvoice,
    ]);
    mockSubscriptionController.chargeInvoice.mockResolvedValue({
      action: {
        type: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null,
        mailTemplateId: 'default-RENEWAL_SUCCESS',
      },
    });

    await service.execute();

    // Verify invoice was charged
    expect(mockSubscriptionController.chargeInvoice).toHaveBeenCalledTimes(1);

    // Verify no deactivation
    expect(
      mockSubscriptionController.deactivateSubscription
    ).not.toHaveBeenCalled();

    expect(mockInvoicePaidNotifier.notify).toHaveBeenCalledWith('inv-1');
    expect(mockMailContext.sendComposedMail).not.toHaveBeenCalled();
  });

  it('charge invoice onsession', async () => {
    const mail = 'dev-mail@test.wepublish.com';
    const renewalDate = new Date();

    const mockInvoice = {
      id: 'inv-1',
      dueAt: renewalDate,
      mail,
      paidAt: null,
      canceledAt: null,
      manuallySetAsPaidByUserId: null,
      scheduledDeactivationAt: add(renewalDate, { days: 5 }),
      currency: Currency.CHF,
      items: [{ amount: 2400, quantity: 1, name: 'Yearly Sub' }],
      subscriptionPeriods: [],
      subscription: {
        id: 'sub-1',
        memberPlanID: 'plan-yearly',
        paymentMethodID: 'payrexx',
        paymentPeriodicity: PaymentPeriodicity.yearly,
        paidUntil: renewalDate,
        autoRenew: true,
        monthlyAmount: 200,
        currency: Currency.CHF,
        paymentMethod: {
          id: 'payrexx',
          paymentProviderID: 'payrexx',
        },
        memberPlan: { name: 'yearly' },
        user: {
          id: 'user-1',
          email: mail,
          paymentProviderCustomers: [],
        },
      },
    };

    mockSubscriptionController.findUnpaidDueInvoices.mockResolvedValue([
      mockInvoice,
    ]);
    mockSubscriptionController.chargeInvoice.mockResolvedValue({
      action: null,
    });

    await service.execute();

    // Verify invoice charge was attempted
    expect(mockSubscriptionController.chargeInvoice).toHaveBeenCalledTimes(1);

    // Verify no deactivation
    expect(
      mockSubscriptionController.deactivateSubscription
    ).not.toHaveBeenCalled();
  });

  it('disable subscription', async () => {
    const mail = 'dev-mail@test.wepublish.com';
    const renewalDate = sub(new Date(), { days: 1 });

    const mockUnpaidInvoice = {
      id: 'inv-1',
      dueAt: renewalDate,
      mail,
      scheduledDeactivationAt: renewalDate,
      currency: Currency.CHF,
      paidAt: null,
      canceledAt: null,
      items: [{ amount: 2400, quantity: 1, name: 'Yearly Sub' }],
      subscription: {
        id: 'sub-1',
        memberPlanID: 'plan-yearly',
        paymentMethodID: 'payrexx',
        paymentPeriodicity: PaymentPeriodicity.yearly,
        autoRenew: true,
        monthlyAmount: 200,
        currency: Currency.CHF,
        user: {
          id: 'user-1',
          email: mail,
        },
      },
    };

    mockSubscriptionController.findUnpaidScheduledForDeactivationInvoices.mockResolvedValue(
      [mockUnpaidInvoice]
    );

    await service.execute();

    // Verify subscription was deactivated
    expect(
      mockSubscriptionController.deactivateSubscription
    ).toHaveBeenCalledTimes(1);
    expect(
      mockSubscriptionController.deactivateSubscription
    ).toHaveBeenCalledWith(expect.objectContaining({ id: 'inv-1' }));
  });

  it('send custom email', async () => {
    const mail = 'dev-mail@test.wepublish.com';
    const renewalDate = add(new Date(), { days: 15 });

    // The sendCustomSubscriptionEmails method queries subscriptions whose
    // paidUntil matches the custom event days. With daysAwayFromEnding=-15,
    // it looks for subscriptions with paidUntil around renewalDate.
    const mockSubscriptionWithEvent = {
      id: 'sub-1',
      memberPlanID: 'plan-yearly',
      paymentMethodID: 'payrexx-subscription',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: renewalDate,
      autoRenew: true,
      monthlyAmount: 200,
      currency: Currency.CHF,
      deactivation: null,
      user: {
        id: 'user-1',
        name: 'test user',
        email: mail,
      },
      memberPlan: { name: 'yearly' },
    };

    // Mock subscription.findMany to return matching subscription for custom mail
    mockPrisma.subscription.findMany.mockResolvedValue([
      mockSubscriptionWithEvent,
    ]);
    mockPrisma.invoice.findMany.mockResolvedValue([]);

    await service.execute();

    // The custom mail sending is triggered through MailController internally.
    // The test verifies the subscription query was made for custom events.
    expect(mockPrisma.subscription.findMany).toHaveBeenCalled();
  });

  describe('a mail the provider refuses', () => {
    const customMailSubscription = () => ({
      id: 'sub-1',
      memberPlanID: 'plan-yearly',
      paymentMethodID: 'payrexx-subscription',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: add(new Date(), { days: 15 }),
      autoRenew: true,
      monthlyAmount: 200,
      currency: Currency.CHF,
      deactivation: null,
      user: {
        id: 'user-1',
        name: 'test user',
        email: 'bea.bregante@bluewin.ch',
      },
      memberPlan: { name: 'yearly' },
    });

    const successfulRuns = () =>
      mockPrisma.periodicJob.update.mock.calls.filter(
        ([{ data }]: any) => data.successfullyFinished
      );

    it('lets the run finish when only that one recipient is at fault', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        customMailSubscription(),
      ]);
      mockMailContext.sendComposedMail.mockRejectedValue(
        new MailProviderRecipientError(
          'Mandrill rejected bea.bregante@bluewin.ch: spam'
        )
      );

      await expect(service.execute()).resolves.toBeUndefined();

      expect(successfulRuns()).toHaveLength(1);
    });

    it('records the refusal on the mail log so it is not lost', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        customMailSubscription(),
      ]);
      mockMailContext.sendComposedMail.mockRejectedValue(
        new MailProviderRecipientError(
          'Mandrill rejected bea.bregante@bluewin.ch: spam'
        )
      );

      await service.execute();

      expect(mockPrisma.mailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'rejected',
            error: 'Mandrill rejected bea.bregante@bluewin.ch: spam',
          }),
        })
      );
    });

    it('still fails the run when the provider itself refuses to send', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        customMailSubscription(),
      ]);
      mockMailContext.sendComposedMail.mockRejectedValue(
        new MailProviderError('Mandrill rejected sender@example.com: unsigned')
      );

      await expect(service.execute()).rejects.toThrow('unsigned');

      expect(successfulRuns()).toHaveLength(0);
    });
  });

  it('Periodic after error rerun', async () => {
    const today = new Date();

    // Simulate a previous failed job
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-failed',
      date: sub(today, { days: 1 }),
      executionTime: sub(today, { days: 1 }),
      finishedWithError: sub(today, { days: 1 }),
      successfullyFinished: null,
      tries: 1,
      error: 'error Message',
    });

    // The retry updates the failed job, then creates a new one for today
    mockPrisma.periodicJob.update.mockResolvedValue({
      id: 'job-failed',
      date: sub(today, { days: 1 }),
      executionTime: new Date(),
      tries: 2,
    });

    await service.execute();

    // Should retry the failed job and run today's job
    expect(mockPrisma.periodicJob.update).toHaveBeenCalled();
    expect(mockPrisma.periodicJob.create).toHaveBeenCalled();
  });

  it('Test failing periodic job with recovery', async () => {
    const today = new Date();

    // First, set up a successful previous job
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-prev',
      date: sub(today, { days: 1 }),
      executionTime: sub(today, { days: 1 }),
      successfullyFinished: sub(today, { days: 1 }),
      finishedWithError: null,
      tries: 1,
      error: null,
    });

    // Set up a subscription that will need an invoice
    const renewalDate = add(new Date(), { days: 13 });
    const mockSubscription = {
      id: 'sub-1',
      memberPlanID: 'plan-yearly',
      paymentMethodID: 'stripe',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: renewalDate,
      autoRenew: true,
      monthlyAmount: 200,
      startsAt: sub(renewalDate, { months: 12 }),
      user: { id: 'user-1', email: 'dev-mail@test.wepublish.com' },
      memberPlan: { name: 'yearly' },
      periods: [],
    };

    // Simulate missing INVOICE_CREATION interval by returning flows without it
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [],
      },
    ]);

    mockSubscriptionController.getActiveSubscriptionsWithoutInvoice.mockResolvedValue(
      [mockSubscription]
    );

    // Execute should fail because no invoice creation interval exists
    try {
      await service.execute();
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toContain(
        'NotFoundException: No invoice creation date found!'
      );
    }

    // Restore the flow intervals and try again
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [
          {
            id: 'interval-invoice-creation',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
            mailTemplate: {
              id: 'mt-4',
            },
          },
          {
            id: 'interval-deactivation-unpaid',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 5,
            mailTemplate: {
              id: 'mt-5',
            },
          },
        ],
      },
    ]);

    // Simulate the failed job that needs retry
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-failed',
      date: startOfDay(today),
      executionTime: today,
      finishedWithError: today,
      successfullyFinished: null,
      tries: 3,
      error: 'No invoice creation date found!',
    });

    mockSubscriptionController.createInvoice.mockResolvedValue({
      id: 'inv-new',
    });

    await service.execute();

    // Should have retried and succeeded
    expect(mockPrisma.periodicJob.update).toHaveBeenCalled();
  });

  it('Test Mail sending with empty user passes email as undefined', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = {};
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      mailTemplateId: 'template',
    };
    await service['sendTemplateMail'](action, user, true, {}, new Date());
    expect(mockMailContext.sendComposedMail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: undefined,
        mailTemplateId: 'template',
      })
    );
  });

  it('Test Mail no template', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = {};
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      mailTemplateId: null,
    };

    await service['sendTemplateMail'](action, user, true, {}, new Date());
  });

  it('Test Mail no user', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const user: User = null;
    const action: Action = {
      type: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: 10,
      mailTemplateId: 'template',
    };
    await service['sendTemplateMail'](action, user, true, {}, new Date());
  });

  it('Get outstanding runs on first run', async () => {
    mockPrisma.periodicJob.findFirst.mockResolvedValue(null);

    const runs = await service['getOutstandingRuns'](new Date());
    expect(runs.length).toEqual(1);
    expect(runs[0].isRetry).toBeFalsy();
    expect(runs[0].date.getTime()).toEqual(startOfDay(new Date()).getTime());
  });

  it('Get outstanding runs if for one week not run', async () => {
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-old',
      date: sub(new Date(), { days: 7 }),
      successfullyFinished: sub(new Date(), { days: 7 }),
      finishedWithError: null,
      tries: 1,
      error: null,
    });

    const runs = await service['getOutstandingRuns'](new Date());

    expect(runs.length).toEqual(7);
    for (const runCtr in runs) {
      expect(runs[runCtr].isRetry).toBeFalsy();
      expect(runs[runCtr].date.getTime()).toEqual(
        startOfDay(sub(new Date(), { days: 6 - parseInt(runCtr) })).getTime()
      );
    }
  });

  it('Get outstanding runs with last run has failed', async () => {
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-failed',
      date: sub(new Date(), { days: 3 }),
      finishedWithError: sub(new Date(), { days: 3 }),
      successfullyFinished: null,
      tries: 1,
      error: 'some error',
    });

    const runs = await service['getOutstandingRuns'](new Date());
    expect(runs.length).toEqual(4);
    const retryRun = runs.shift();
    expect(retryRun!.isRetry).toBeTruthy();
    expect(retryRun!.date).toEqual(startOfDay(sub(new Date(), { days: 3 })));
    for (const runCtr in runs) {
      expect(runs[runCtr].isRetry).toBeFalsy();
      expect(runs[runCtr].date.getTime()).toEqual(
        startOfDay(sub(new Date(), { days: 2 - parseInt(runCtr) })).getTime()
      );
    }
  });

  it('Get outstanding runs retries a run that was started longer ago than a night but never finished', async () => {
    const today = new Date();
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-aborted',
      date: startOfDay(sub(today, { days: 1 })),
      executionTime: sub(today, { days: 1 }),
      successfullyFinished: null,
      finishedWithError: null,
      tries: 0,
      error: null,
    });

    const runs = await service['getOutstandingRuns'](today);

    expect(runs).toEqual([
      {
        isRetry: true,
        date: startOfDay(sub(today, { days: 1 })),
        lastStartedAt: sub(today, { days: 1 }),
      },
      { isRetry: false, date: startOfDay(today) },
    ]);
  });

  it('Get outstanding runs leaves a run alone that was started recently and may still be running', async () => {
    const today = new Date();
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-running',
      date: startOfDay(today),
      executionTime: sub(today, { hours: 1 }),
      successfullyFinished: null,
      finishedWithError: null,
      tries: 0,
      error: null,
    });

    const runs = await service['getOutstandingRuns'](today);

    expect(runs).toEqual([]);
  });

  it('reruns an aborted night on the row it left behind and marks it successful', async () => {
    const today = new Date();
    const abortedDate = startOfDay(sub(today, { days: 1 }));
    const abortedStart = sub(today, { days: 1 });
    mockPrisma.periodicJob.findFirst.mockResolvedValue({
      id: 'job-aborted',
      date: abortedDate,
      executionTime: abortedStart,
      successfullyFinished: null,
      finishedWithError: null,
      tries: 0,
      error: null,
    });
    mockPrisma.periodicJob.updateManyAndReturn.mockImplementation(
      ({ where, data }) => [
        { id: 'job-aborted', date: where.date, tries: 0, ...data },
      ]
    );

    await service.execute(today);

    expect(mockPrisma.periodicJob.updateManyAndReturn).toHaveBeenCalledWith({
      where: {
        date: abortedDate,
        executionTime: abortedStart,
        successfullyFinished: null,
      },
      data: { executionTime: expect.any(Date) },
    });
    expect(mockPrisma.periodicJob.update).toHaveBeenCalledWith({
      where: { id: 'job-aborted' },
      data: { successfullyFinished: expect.any(Date), tries: 1 },
    });
    expect(mockPrisma.periodicJob.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.periodicJob.create).toHaveBeenCalledWith({
      data: { date: startOfDay(today), executionTime: expect.any(Date) },
    });
  });

  it('Concurrent periodic job run protection', async () => {
    mockPrisma.periodicJob.findFirst.mockResolvedValue(null);
    mockPrisma.periodicJob.findMany.mockResolvedValue([]);

    const runs = await service['getOutstandingRuns'](new Date());
    expect(await service['isAlreadyAJobRunning']()).toBeFalsy();

    mockPrisma.periodicJob.create.mockResolvedValue({
      id: 'job-1',
      date: runs[0].date,
      executionTime: new Date(),
      tries: 1,
    });

    await service['markJobStarted'](runs[0].date);

    mockPrisma.periodicJob.findMany.mockResolvedValue([{ id: 'job-1' }]);
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy();

    await service['markJobFailed']('Failed with X');

    // After marking failed, runningJob is cleared but DB still shows recent job
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy();

    // Simulate job older than 2 hours
    mockPrisma.periodicJob.findMany.mockResolvedValue([]);
    expect(await service['isAlreadyAJobRunning']()).toBeFalsy();

    mockPrisma.periodicJob.updateManyAndReturn.mockResolvedValue([
      {
        id: 'job-1',
        date: runs[0].date,
        executionTime: new Date(),
        tries: 2,
      },
    ]);
    await service['retryFailedJob']({
      isRetry: true,
      date: runs[0].date,
      lastStartedAt: null,
    });

    mockPrisma.periodicJob.findMany.mockResolvedValue([{ id: 'job-1' }]);
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy();

    await service['markJobSuccessful']();
    expect(await service['isAlreadyAJobRunning']()).toBeTruthy();
  });

  it('random timeout for concurrent execution of periodic job', async () => {
    service['randomNumberRangeForConcurrency'] = 500;
    const timeout =
      await service['sleepForRandomIntervalToEnsureConcurrency']();
    expect(timeout).toBeLessThanOrEqual(500);
    expect(timeout).toBeGreaterThanOrEqual(0);
  });

  it('Concurrent execute', async () => {
    service['randomNumberRangeForConcurrency'] = 500;
    mockPrisma.periodicJob.findMany.mockResolvedValue([]);
    mockPrisma.periodicJob.findFirst.mockResolvedValue(null);

    await service.concurrentExecute();

    // Should have created a job for today
    expect(mockPrisma.periodicJob.create).toHaveBeenCalled();
  });

  it('Concurrent execute with already running process', async () => {
    service['randomNumberRangeForConcurrency'] = 500;

    // Simulate a recently started job
    mockPrisma.periodicJob.findMany.mockResolvedValue([
      {
        id: 'job-running',
        date: new Date(),
        executionTime: new Date(),
      },
    ]);

    await service.concurrentExecute();

    // Should not have created a new job since one is already running
    expect(mockPrisma.periodicJob.create).not.toHaveBeenCalled();
  });

  it('Mark job as successful while now job runs', async () => {
    try {
      await service['markJobSuccessful']();
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Try to make a job as successful while none is running!'
      );
    }
  });

  it('Mark job as failed while now job runs', async () => {
    try {
      await service['markJobFailed']('error');
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Try to make a job as failed while none is running!'
      );
    }
  });

  it('Invoice creation missing invoice creation or invoice deletion object', async () => {
    // Set up flows without INVOICE_CREATION for a specific member plan
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [
          {
            id: 'interval-deactivation-unpaid',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 5,
            mailTemplate: null,
          },
        ],
      },
      {
        id: 'specific-flow',
        default: false,
        memberPlanId: 'mp-1',
        autoRenewal: [true],
        periodicities: [PaymentPeriodicity.biannual],
        paymentMethods: [{ id: 'pm-1' }],
        intervals: [],
      },
    ]);

    const runDate = startOfDay(new Date());
    const pjo: any = {
      date: runDate,
    };
    const invoice: any = {
      memberPlanID: 'mp-1',
      paymentMethodID: 'pm-1',
      autoRenew: true,
      paymentPeriodicity: PaymentPeriodicity.biannual,
    };

    try {
      await service['createInvoice'](pjo, invoice);
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: No invoice creation found!'
      );
    }

    // Add INVOICE_CREATION interval but no DEACTIVATION_UNPAID
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [],
      },
      {
        id: 'specific-flow',
        default: false,
        memberPlanId: 'mp-1',
        autoRenewal: [true],
        periodicities: [PaymentPeriodicity.biannual],
        paymentMethods: [{ id: 'pm-1' }],
        intervals: [
          {
            id: 'interval-ic',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -10,
            mailTemplate: null,
          },
        ],
      },
    ]);

    try {
      await service['createInvoice'](pjo, invoice);
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: No invoice deactivation event found!'
      );
    }

    // Add both INVOICE_CREATION and DEACTIVATION_UNPAID
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [],
      },
      {
        id: 'specific-flow',
        default: false,
        memberPlanId: 'mp-1',
        autoRenewal: [true],
        periodicities: [PaymentPeriodicity.biannual],
        paymentMethods: [{ id: 'pm-1' }],
        intervals: [
          {
            id: 'interval-ic',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -10,
            mailTemplate: null,
          },
          {
            id: 'interval-du',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: null,
            mailTemplate: null,
          },
        ],
      },
    ]);

    invoice.paidUntil = add(runDate, { days: 11 });
    mockSubscriptionController.createInvoice.mockResolvedValue({
      id: 'inv-1',
    });
    const skipped = await service['createInvoice'](pjo, invoice);
    expect(skipped).toBe(false);
    expect(mockSubscriptionController.createInvoice).not.toHaveBeenCalled();

    // When paidUntil is within range, invoice should be created
    invoice.paidUntil = add(runDate, { days: 10, seconds: -10 });
    await service['createInvoice'](pjo, invoice);
    expect(mockSubscriptionController.createInvoice).toHaveBeenCalledTimes(1);
    // No mail sent because mailTemplate is null in the flow
    expect(mockMailContext.sendComposedMail).not.toHaveBeenCalled();

    invoice.paidUntil = add(runDate, { days: 9 });
    await service['createInvoice'](pjo, invoice);
    expect(mockSubscriptionController.createInvoice).toHaveBeenCalledTimes(2);
  });

  it('Charge Invoice missing subscription', async () => {
    const pjo: any = {};
    const invoice: any = {};
    try {
      await service['chargeInvoice'](pjo, invoice);
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Invoice undefined has no subscription assigned!'
      );
    }
  });

  it('Deactivate subscription missing invoice deletion object', async () => {
    // Set up flows with a specific flow that has no DEACTIVATION_UNPAID
    mockPrisma.subscriptionFlow.findMany.mockResolvedValue([
      {
        id: 'default-flow',
        default: true,
        memberPlanId: null,
        autoRenewal: [],
        periodicities: [],
        paymentMethods: [],
        intervals: [],
      },
      {
        id: 'specific-flow',
        default: false,
        memberPlanId: 'mp-2',
        autoRenewal: [true],
        periodicities: [PaymentPeriodicity.biannual],
        paymentMethods: [{ id: 'pm-2' }],
        intervals: [],
      },
    ]);

    const runDate = startOfDay(new Date());
    const pjo: any = {
      date: runDate,
    };
    const invoice: any = {
      id: 100,
    };

    try {
      await service['deactivateSubscriptionByInvoice'](pjo, invoice);
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toMatchInlineSnapshot(
        `"BadRequestException: Invoice 100 has no subscription assigned!"`
      );
    }

    invoice.subscription = {
      memberPlanID: 'mp-2',
      paymentMethodID: 'pm-2',
      autoRenew: true,
      paymentPeriodicity: PaymentPeriodicity.biannual,
    };

    try {
      await service['deactivateSubscriptionByInvoice'](pjo, invoice);
      throw new Error('Expected to throw');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: No subscription deactivation found!'
      );
    }
  });

  it('checkStateOfOpenInvoices should call checkInvoiceState for each open invoice', async () => {
    const openInvoices = [
      {
        id: 'inv1',
        subscription: {
          id: 'sub1',
          paymentMethod: {},
          memberPlan: {},
          user: {},
        },
        items: [],
        subscriptionPeriods: [],
      },
      {
        id: 'inv2',
        subscription: {
          id: 'sub2',
          paymentMethod: {},
          memberPlan: {},
          user: {},
        },
        items: [],
        subscriptionPeriods: [],
      },
    ];
    mockSubscriptionController.findAllOpenInvoices.mockResolvedValue(
      openInvoices
    );
    mockSubscriptionController.checkInvoiceState.mockResolvedValue(undefined);

    await service['checkStateOfOpenInvoices']();

    expect(mockSubscriptionController.findAllOpenInvoices).toHaveBeenCalled();
    expect(mockSubscriptionController.checkInvoiceState).toHaveBeenCalledTimes(
      openInvoices.length
    );
    expect(mockSubscriptionController.checkInvoiceState).toHaveBeenCalledWith(
      openInvoices[0]
    );
    expect(mockSubscriptionController.checkInvoiceState).toHaveBeenCalledWith(
      openInvoices[1]
    );
  });

  it('should throw if invoice has no subscription', async () => {
    const openInvoices = [
      {
        id: 'inv1',
        subscription: null,
        items: [],
        subscriptionPeriods: [],
      },
    ];
    mockSubscriptionController.findAllOpenInvoices.mockResolvedValue(
      openInvoices
    );
    mockSubscriptionController.checkInvoiceState.mockResolvedValue(undefined);

    await expect(service['checkStateOfOpenInvoices']()).rejects.toThrow(
      /Invoice inv1 has no subscription assigned!/
    );
  });

  it('checkInvoiceState should call subscriptionController.checkInvoiceState with the correct invoice', async () => {
    const invoice = {
      id: 'invoice1',
      subscription: {
        id: 'sub1',
        paymentMethod: {},
        memberPlan: {},
        user: {},
      },
      items: [],
      subscriptionPeriods: [],
    } as any;

    mockSubscriptionController.checkInvoiceState.mockResolvedValue(undefined);

    await service['checkInvoiceState'](invoice);

    expect(mockSubscriptionController.checkInvoiceState).toHaveBeenCalledWith(
      invoice
    );
  });

  it('checkInvoiceState should throw if invoice has no subscription', async () => {
    const invoice = {
      id: 'invoice2',
      subscription: null,
      items: [],
      subscriptionPeriods: [],
    } as any;

    await expect(service['checkInvoiceState'](invoice)).rejects.toThrow(
      `Invoice ${invoice.id} has no subscription assigned!`
    );
  });
  describe('a run that fails', () => {
    const unauthorized = { code: 401, message: { message: 'Unauthorized' } };
    const user = { id: 'user-1', email: 'dev-mail@test.wepublish.com' };
    const subscription = {
      id: 'sub-1',
      memberPlanID: 'plan-yearly',
      paymentMethodID: 'stripe',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: add(new Date(), { days: 13 }),
      autoRenew: true,
      monthlyAmount: 200,
      currency: Currency.CHF,
      user,
      memberPlan: { name: 'yearly', slug: 'yearly' },
      periods: [],
    };
    const invoice = {
      id: 'inv-1',
      dueAt: new Date(),
      paidAt: null,
      canceledAt: null,
      items: [],
      subscriptionPeriods: [],
      subscription,
    };

    it.each([
      [
        'Sending custom mails for subscription sub-1 failed',
        () => {
          mockPrisma.subscription.findMany.mockResolvedValueOnce([
            { ...subscription, paidUntil: add(new Date(), { days: 15 }) },
          ]);
          mockPrisma.invoice.findMany.mockRejectedValueOnce(unauthorized);
        },
      ],
      [
        'Checking the state of invoice inv-1 failed',
        () => {
          mockSubscriptionController.findAllOpenInvoices.mockResolvedValue([
            invoice,
          ]);
          mockSubscriptionController.checkInvoiceState.mockRejectedValue(
            unauthorized
          );
        },
      ],
      [
        'Creating the invoice for subscription sub-1 failed',
        () => {
          mockSubscriptionController.getActiveSubscriptionsWithoutInvoice.mockResolvedValue(
            [subscription]
          );
          mockSubscriptionController.createInvoice.mockRejectedValue(
            unauthorized
          );
        },
      ],
      [
        'Charging invoice inv-1 failed',
        () => {
          mockSubscriptionController.findUnpaidDueInvoices.mockResolvedValue([
            invoice,
          ]);
          mockSubscriptionController.chargeInvoice.mockRejectedValue(
            unauthorized
          );
        },
      ],
      [
        'Deactivating subscription sub-1 for unpaid invoice inv-1 failed',
        () => {
          mockSubscriptionController.findUnpaidScheduledForDeactivationInvoices.mockResolvedValue(
            [invoice]
          );
          mockSubscriptionController.deactivateSubscription.mockRejectedValue(
            unauthorized
          );
        },
      ],
    ])('says what it was doing: %s', async (context, failOnce) => {
      failOnce();

      await expect(service.execute()).rejects.toThrow(
        `${context}: 401 Unauthorized`
      );
      expect(mockPrisma.periodicJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: expect.stringContaining(`${context}: 401 Unauthorized`),
          }),
        })
      );
    });
  });

  describe('retrying a failed run from the editor', () => {
    type JobRow = {
      id: string;
      date: Date;
      executionTime: Date | null;
      successfullyFinished: Date | null;
      finishedWithError: Date | null;
      tries: number;
      error: string | null;
    };

    const dbDate = (day: Date) =>
      new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
    const daysAgo = (days: number) => startOfDay(sub(new Date(), { days }));
    const minutesAgo = (minutes: number) => sub(new Date(), { minutes });

    let rows: JobRow[];
    let otherPod: PeriodicJobService;

    const matches = (row: JobRow, where: Partial<JobRow>) =>
      Object.entries(where).every(([field, expected]) => {
        const actual = row[field as keyof JobRow];

        return expected instanceof Date ?
            actual instanceof Date && actual.getTime() === expected.getTime()
          : actual === expected;
      });

    const seed = (row: Partial<JobRow> & { date: Date }) => {
      rows.push({
        id: `job-${rows.length + 1}`,
        executionTime: null,
        successfullyFinished: null,
        finishedWithError: null,
        tries: 1,
        error: null,
        ...row,
        date: dbDate(row.date),
      });
    };

    const failedNight = (day: Date) =>
      seed({
        date: day,
        executionTime: set(day, { hours: 3 }),
        finishedWithError: set(day, { hours: 3, minutes: 5 }),
        error: 'provider down',
      });

    const startPod = (kv: object = locks) =>
      new PeriodicJobService(
        mockPrisma as unknown as PrismaClient,
        mockMailContext as unknown as MailContext,
        mockSubscriptionController as unknown as SubscriptionService,
        mockPaymentsService as unknown as PaymentsService,
        mockInvoicePaidNotifier as unknown as InvoicePaidNotifier,
        kv as unknown as KvTtlCacheService
      );

    const holdFirstRun = () => {
      let finish = () => undefined as void;
      const held = new Promise<never[]>(resolve => {
        finish = () => resolve([]);
      });
      mockSubscriptionController.findAllOpenInvoices.mockImplementationOnce(
        () => held
      );

      return finish;
    };

    const lockReleased = () =>
      vi.waitFor(() => expect(locks.held.size).toBe(0));

    const allRunsFinished = () =>
      vi.waitFor(() =>
        expect(rows.every(row => row.successfullyFinished)).toBe(true)
      );

    beforeEach(() => {
      rows = [];

      Object.assign(mockPrisma.periodicJob, {
        findFirst: vi.fn(async () => {
          const [latest] = [...rows].sort(
            (a, b) => b.date.getTime() - a.date.getTime()
          );

          return latest ? { ...latest } : null;
        }),
        create: vi.fn(
          async ({
            data,
          }: {
            data: Pick<JobRow, 'date'> & Partial<JobRow>;
          }) => {
            if (rows.some(row => row.date.getTime() === data.date.getTime())) {
              throw Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
              });
            }

            const row: JobRow = {
              id: `job-${rows.length + 1}`,
              date: data.date,
              executionTime: data.executionTime ?? null,
              successfullyFinished: null,
              finishedWithError: null,
              tries: 0,
              error: null,
            };
            rows.push(row);

            return { ...row };
          }
        ),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: Partial<JobRow>;
            data: Partial<JobRow>;
          }) => {
            const row = rows.find(candidate => matches(candidate, where));

            if (!row) {
              throw Object.assign(new Error('Record to update not found'), {
                code: 'P2025',
              });
            }

            return { ...Object.assign(row, data) };
          }
        ),
        updateManyAndReturn: vi.fn(
          async ({
            where,
            data,
          }: {
            where: Partial<JobRow>;
            data: Partial<JobRow>;
          }) =>
            rows
              .filter(row => matches(row, where))
              .map(row => ({ ...Object.assign(row, data) }))
        ),
      });

      otherPod = startPod();
    });

    it('retries the failed night and then runs every night up to today', async () => {
      failedNight(daysAgo(2));

      await service.retryAndCatchUp();
      await lockReleased();

      expect(rows.map(row => [row.date, !!row.successfullyFinished])).toEqual([
        [dbDate(daysAgo(2)), true],
        [dbDate(daysAgo(1)), true],
        [dbDate(daysAgo(0)), true],
      ]);
    });

    it('answers as soon as the failed night is taken over and reports it as running until done', async () => {
      failedNight(daysAgo(1));
      const finish = holdFirstRun();

      const job = await service.retryAndCatchUp();

      expect(job.date).toEqual(dbDate(daysAgo(1)));
      await expect(otherPod.isRunning(job)).resolves.toBe(true);

      finish();
      await lockReleased();

      await expect(otherPod.isRunning(rows[0])).resolves.toBe(false);
    });

    it.each([
      ['the nightly run', (pod: PeriodicJobService) => pod.execute()],
      [
        'a retry started from the editor',
        (pod: PeriodicJobService) => pod.retryAndCatchUp(),
      ],
    ])(
      'refuses a second run while %s is going on on another pod',
      async (_, startRun) => {
        failedNight(daysAgo(1));
        const finish = holdFirstRun();
        const running = startRun(otherPod);
        await vi.waitFor(() => expect(locks.held.size).toBe(1));

        await expect(service.retryAndCatchUp()).rejects.toBeInstanceOf(
          ConflictException
        );

        finish();
        await running;
        await lockReleased();
      }
    );

    it('keeps the nightly run away while a retry started from the editor goes on on another pod', async () => {
      failedNight(daysAgo(1));
      const finish = holdFirstRun();
      await otherPod.retryAndCatchUp();

      await service.execute();

      expect(rows).toHaveLength(1);
      finish();
      await lockReleased();
      expect(rows).toHaveLength(2);
    });

    it.each([
      [
        'the last night succeeded',
        () =>
          seed({
            date: daysAgo(1),
            executionTime: daysAgo(1),
            successfullyFinished: daysAgo(1),
          }),
      ],
      ['no night ran yet', () => undefined],
    ])('refuses when %s and frees the lock again', async (_, seedJobs) => {
      seedJobs();

      await expect(service.retryAndCatchUp()).rejects.toBeInstanceOf(
        BadRequestException
      );
      expect(locks.held.size).toBe(0);
    });

    it('lets only one of two pods through when both retry at the same moment', async () => {
      failedNight(daysAgo(1));

      const results = await Promise.allSettled([
        service.retryAndCatchUp(),
        otherPod.retryAndCatchUp(),
      ]);
      await lockReleased();

      expect(results.map(result => result.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ]);
      expect(
        results.find(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected'
        )?.reason
      ).toBeInstanceOf(ConflictException);
      expect(rows.map(row => row.date)).toEqual([
        dbDate(daysAgo(1)),
        dbDate(daysAgo(0)),
      ]);
    });

    it('takes over a run whose pod died as soon as its lock ran out', async () => {
      seed({ date: daysAgo(0), executionTime: minutesAgo(5), tries: 0 });

      await expect(service.isRunning(rows[0])).resolves.toBe(false);
      const job = await service.retryAndCatchUp();
      await lockReleased();

      expect(job.date).toEqual(dbDate(daysAgo(0)));
      expect(rows).toHaveLength(1);
      expect(rows[0].successfullyFinished).toBeTruthy();
    });

    it('stops before the next night once it lost its lock', async () => {
      failedNight(daysAgo(2));
      const finish = holdFirstRun();
      await service.retryAndCatchUp();

      [...locks.held.values()][0].lost = true;
      finish();
      await lockReleased();

      expect(rows).toHaveLength(1);
      expect(rows[0].successfullyFinished).toBeTruthy();
    });

    it('keeps the nightly run from taking over a failed night another pod has just claimed', async () => {
      failedNight(daysAgo(1));
      const [failedRun] = await otherPod['getOutstandingRuns'](new Date());

      await service.retryAndCatchUp();

      await expect(
        otherPod['retryFailedJob'](failedRun as never)
      ).rejects.toBeInstanceOf(ConflictException);
      await lockReleased();
    });

    describe('without Dragonfly', () => {
      it('refuses while the last run started recently and has not finished', async () => {
        const pod = startPod(createLocksWithoutDragonfly());
        seed({
          date: daysAgo(1),
          executionTime: minutesAgo(10),
          finishedWithError: minutesAgo(600),
          error: 'provider down',
        });

        await expect(pod.isRunning(rows[0])).resolves.toBe(true);
        await expect(pod.retryAndCatchUp()).rejects.toBeInstanceOf(
          ConflictException
        );
      });

      it('still lets only one of two pods through', async () => {
        const first = startPod(createLocksWithoutDragonfly());
        const second = startPod(createLocksWithoutDragonfly());
        failedNight(daysAgo(1));

        const results = await Promise.allSettled([
          first.retryAndCatchUp(),
          second.retryAndCatchUp(),
        ]);
        await allRunsFinished();

        expect(results.map(result => result.status).sort()).toEqual([
          'fulfilled',
          'rejected',
        ]);
        expect(rows).toHaveLength(2);
      });

      it('refuses while Dragonfly is configured but unreachable', async () => {
        const pod = startPod(createLocksWithoutDragonfly('unreachable'));
        failedNight(daysAgo(1));

        await expect(pod.retryAndCatchUp()).rejects.toBeInstanceOf(
          ServiceUnavailableException
        );
        expect(
          mockPrisma.periodicJob.updateManyAndReturn
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe('isPeriodicJobRunning', () => {
    const now = new Date();
    const ago = (minutes: number) => sub(now, { minutes });

    it.each([
      ['started and not finished yet', { executionTime: ago(10) }, true],
      [
        'started again after it failed',
        { executionTime: ago(10), finishedWithError: ago(600) },
        true,
      ],
      ['failed', { executionTime: ago(60), finishedWithError: ago(55) }, false],
      [
        'successful',
        { executionTime: ago(60), successfullyFinished: ago(55) },
        false,
      ],
      [
        'successful after a retry',
        {
          executionTime: ago(30),
          finishedWithError: ago(600),
          successfullyFinished: ago(20),
        },
        false,
      ],
      [
        'started longer ago than a night and never finished',
        { executionTime: sub(now, { hours: 13 }) },
        false,
      ],
      ['never started', {}, false],
    ])('%s', (_, job, running) => {
      expect(isPeriodicJobRunning(job, now.getTime())).toBe(running);
    });
  });
});
