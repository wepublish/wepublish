import { Test, TestingModule } from '@nestjs/testing';
import {
  Currency,
  PaymentPeriodicity,
  SubscriptionEvent,
  User,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { add, startOfDay, sub } from 'date-fns';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';
import { SubscriptionService } from './subscription.service';
import { PeriodicJobService } from './periodic-job.service';
import { PaymentsService } from '@wepublish/payment/api';
import { MailContext } from '@wepublish/mail/api';

const createMockPrisma = () => ({
  subscriptionFlow: {
    findMany: jest.fn().mockResolvedValue([
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
              externalMailTemplateId: 'default-SUBSCRIBE',
            },
          },
          {
            id: 'interval-renewal-success',
            event: SubscriptionEvent.RENEWAL_SUCCESS,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-2',
              externalMailTemplateId: 'default-RENEWAL_SUCCESS',
            },
          },
          {
            id: 'interval-renewal-failed',
            event: SubscriptionEvent.RENEWAL_FAILED,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-3',
              externalMailTemplateId: 'default-RENEWAL_FAILED',
            },
          },
          {
            id: 'interval-invoice-creation',
            event: SubscriptionEvent.INVOICE_CREATION,
            daysAwayFromEnding: -14,
            mailTemplate: {
              id: 'mt-4',
              externalMailTemplateId: 'default-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-deactivation-unpaid',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 5,
            mailTemplate: {
              id: 'mt-5',
              externalMailTemplateId: 'default-DEACTIVATION_UNPAID',
            },
          },
          {
            id: 'interval-deactivation-by-user',
            event: SubscriptionEvent.DEACTIVATION_BY_USER,
            daysAwayFromEnding: null,
            mailTemplate: {
              id: 'mt-6',
              externalMailTemplateId: 'default-DEACTIVATION_BY_USER',
            },
          },
          {
            id: 'interval-custom',
            event: SubscriptionEvent.CUSTOM,
            daysAwayFromEnding: -15,
            mailTemplate: {
              id: 'mt-7',
              externalMailTemplateId: 'default-CUSTOM1',
            },
          },
        ],
      },
    ]),
    findFirst: jest.fn(),
  },
  subscriptionInterval: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  periodicJob: {
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(({ data }) => ({
      id: 'job-1',
      date: data.date,
      executionTime: data.executionTime || new Date(),
      successfullyFinished: data.successfullyFinished || null,
      finishedWithError: data.finishedWithError || null,
      tries: data.tries || 1,
      error: data.error || null,
    })),
    update: jest.fn().mockImplementation(({ data }) => ({
      id: 'job-1',
      ...data,
    })),
    updateMany: jest.fn(),
  },
  subscription: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  invoice: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  },
  mailLog: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  memberPlan: {
    create: jest.fn(),
  },
  paymentMethod: {
    create: jest.fn(),
  },
  subscriptionDeactivation: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn().mockImplementation(async (operations: any) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }
    return operations;
  }),
});

const createMockSubscriptionController = () => ({
  findAllOpenInvoices: jest.fn().mockResolvedValue([]),
  getActiveSubscriptionsWithoutInvoice: jest.fn().mockResolvedValue([]),
  findUnpaidDueInvoices: jest.fn().mockResolvedValue([]),
  findUnpaidScheduledForDeactivationInvoices: jest.fn().mockResolvedValue([]),
  findActiveExpiredNotAutoRenewSubscriptions: jest.fn().mockResolvedValue([]),
  createInvoice: jest.fn(),
  chargeInvoice: jest.fn(),
  deactivateSubscription: jest.fn(),
  checkInvoiceState: jest.fn(),
});

const createMockMailContext = () => ({
  mailProvider: {
    id: 'fakeMail',
    sendMail: jest.fn().mockResolvedValue(undefined),
    getTemplateUrl: jest.fn(),
    getTemplates: jest.fn(),
    name: 'FakeMail',
    sendRemoteTemplateMail: jest.fn().mockResolvedValue(undefined),
  },
  prisma: null,
  kv: null,
  jwtGenerator: jest.fn().mockResolvedValue('test-jwt-token'),
  sendRemoteTemplateDirect: jest.fn().mockResolvedValue(undefined),
});

const createMockPaymentsService = () => ({
  findPaymentProviderByPaymentMethodeId: jest.fn().mockResolvedValue(null),
  getProviders: jest.fn().mockReturnValue([]),
});

describe('PeriodicJobService', () => {
  let service: PeriodicJobService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockSubscriptionController: ReturnType<
    typeof createMockSubscriptionController
  >;
  let mockMailContext: ReturnType<typeof createMockMailContext>;
  let mockPaymentsService: ReturnType<typeof createMockPaymentsService>;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();
    mockSubscriptionController = createMockSubscriptionController();
    mockMailContext = createMockMailContext();
    mockPaymentsService = createMockPaymentsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodicJobService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSubscriptionController },
        { provide: MailContext, useValue: mockMailContext },
        { provide: PaymentsService, useValue: mockPaymentsService },
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
        externalMailTemplate: 'default-RENEWAL_SUCCESS',
      },
    });

    await service.execute();

    // Verify invoice was charged
    expect(mockSubscriptionController.chargeInvoice).toHaveBeenCalledTimes(1);

    // Verify no deactivation
    expect(
      mockSubscriptionController.deactivateSubscription
    ).not.toHaveBeenCalled();
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
              externalMailTemplateId: 'default-INVOICE_CREATION',
            },
          },
          {
            id: 'interval-deactivation-unpaid',
            event: SubscriptionEvent.DEACTIVATION_UNPAID,
            daysAwayFromEnding: 5,
            mailTemplate: {
              id: 'mt-5',
              externalMailTemplateId: 'default-DEACTIVATION_UNPAID',
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
      externalMailTemplate: 'template',
    };
    await service['sendTemplateMail'](action, user, true, {}, new Date());
    expect(mockMailContext.sendRemoteTemplateDirect).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: undefined,
        remoteTemplate: 'template',
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
      externalMailTemplate: null,
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
      externalMailTemplate: 'template',
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

    mockPrisma.periodicJob.update.mockResolvedValue({
      id: 'job-1',
      date: runs[0].date,
      executionTime: new Date(),
      tries: 2,
    });
    await service['retryFailedJob'](runs[0].date);

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
    expect(mockMailContext.sendRemoteTemplateDirect).not.toHaveBeenCalled();

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
});
