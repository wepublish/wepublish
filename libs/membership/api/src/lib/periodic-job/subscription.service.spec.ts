import {
  Currency,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
} from '@prisma/client';
import nock from 'nock';
import { Test, TestingModule } from '@nestjs/testing';

import { PaymentsModule } from '@wepublish/payment/api';
import { add, sub } from 'date-fns';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';
import { SubscriptionFlowService } from '../subscription-flow/subscription-flow.service';
import {
  registerMailsModule,
  registerPaymentMethodModule,
} from '../testing/module-registrars';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionPaymentsService', () => {
  let subscriptionService: SubscriptionService;
  let prismaMock: {
    subscription: {
      [method in keyof PrismaClient['subscription']]?: jest.Mock;
    };
    invoice: { [method in keyof PrismaClient['invoice']]?: jest.Mock };
    subscriptionPeriod: {
      [method in keyof PrismaClient['subscriptionPeriod']]?: jest.Mock;
    };
    payment: { [method in keyof PrismaClient['payment']]?: jest.Mock };
    subscriptionDeactivation: {
      [method in keyof PrismaClient['subscriptionDeactivation']]?: jest.Mock;
    };
  };

  const mockMemberPlan = {
    id: 'plan-1',
    name: 'memberplan',
    slug: 'memberplan',
    description: 'Test Plan',
    active: true,
    amountPerMonthMin: 100,
    currency: Currency.CHF,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@wepublish.com',
    name: 'user',
    password: 'xxx',
    active: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    modifiedAt: new Date(),
    roleIDs: [],
    properties: [],
    birthday: null,
    flair: null,
    userImageID: null,
    firstName: null,
    lastLogin: null,
  };

  beforeEach(async () => {
    await nock.disableNetConnect();

    prismaMock = {
      subscription: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      subscriptionPeriod: {
        create: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      subscriptionDeactivation: {
        create: jest.fn(),
      },
    } as any;
    (prismaMock as any).$transaction = jest
      .fn()
      .mockImplementation(async (operations: any) => {
        return await Promise.all(operations);
      });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        registerMailsModule(),
        registerPaymentMethodModule(),
        PaymentsModule,
      ],
      providers: [
        SubscriptionFlowService,
        SubscriptionService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(async () => {
    await nock.cleanAll();
    await nock.enableNetConnect();
  });

  it('get subscriptions for invoice creation', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        paidUntil: add(new Date(), { days: 1 }),
        autoRenew: true,
        deactivation: null,
        currency: Currency.CHF,
        periods: [
          {
            startsAt: add(new Date(), { days: 1 }),
            endsAt: add(new Date(), { years: 1 }),
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 22,
          },
        ],
      },
    ];

    prismaMock.subscription.findMany!.mockResolvedValue(mockSubscriptions);

    const subscriptionsToExtend =
      await subscriptionService.getActiveSubscriptionsWithoutInvoice(
        new Date(),
        add(new Date(), { days: 200 })
      );
    expect(subscriptionsToExtend.length).toEqual(1);
    expect(prismaMock.subscription.findMany).toHaveBeenCalled();
  });

  it('invoices to charge', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), { days: 1 }),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true,
        },
      },
      {
        id: 'invoice-2',
        dueAt: add(new Date(), { seconds: 10 }),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true,
        },
      },
    ];

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices);

    const invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(
      new Date()
    );
    expect(invoicesToCharge.length).toEqual(2);
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
  });

  it('does not re-charge an invoice whose in-flight payment is still within the grace period, but does once it goes stale', async () => {
    const runDate = new Date('2026-06-15');
    prismaMock.invoice.findMany!.mockResolvedValue([
      {
        id: 'fresh-in-flight',
        subscription: { confirmed: true, paymentMethod: { gracePeriod: 14 } },
      },
      {
        id: 'stale-in-flight',
        subscription: { confirmed: true, paymentMethod: { gracePeriod: 14 } },
      },
      {
        id: 'no-in-flight',
        subscription: { confirmed: true, paymentMethod: { gracePeriod: 14 } },
      },
    ]);
    prismaMock.payment.findMany!.mockResolvedValue([
      { invoiceID: 'fresh-in-flight', createdAt: new Date('2026-06-14') },
      { invoiceID: 'stale-in-flight', createdAt: new Date('2026-05-01') },
    ]);

    const result = await subscriptionService.findUnpaidDueInvoices(runDate);

    expect(result.map(invoice => invoice.id)).toEqual([
      'stale-in-flight',
      'no-in-flight',
    ]);
  });

  it('skips unconfirmed invoices', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), { days: 1 }),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true,
        },
      },
      {
        id: 'invoice-2',
        dueAt: sub(new Date(), { days: 1 }),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: false,
        },
      },
    ];

    prismaMock.invoice.findMany!.mockResolvedValue(
      mockInvoices.filter(inv => inv.subscription.confirmed)
    );

    const invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(
      new Date()
    );
    expect(invoicesToCharge.length).toEqual(1);
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
  });

  it('skips invoices without subscription', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), { days: 1 }),
        paidAt: null,
        canceledAt: null,
        subscriptionID: 'sub-1',
        subscription: {
          confirmed: true,
        },
      },
    ];

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices);

    const invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(
      new Date()
    );
    expect(invoicesToCharge.length).toEqual(1);
    expect(invoicesToCharge[0].id).toEqual('invoice-1');
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
  });

  it('invoices of subscriptions to deactivate', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        scheduledDeactivationAt: sub(new Date(), { days: 1 }),
        paidAt: null,
        canceledAt: null,
      },
    ];

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices);

    const invoicesToDeactivate =
      await subscriptionService.findUnpaidScheduledForDeactivationInvoices(
        new Date()
      );
    expect(invoicesToDeactivate.length).toEqual(1);
    expect(prismaMock.invoice.findMany).toHaveBeenCalled();
  });

  it('does not deactivate an invoice whose in-flight payment is still within the grace period, but does once it goes stale', async () => {
    const runDate = new Date('2026-06-15');
    prismaMock.invoice.findMany!.mockResolvedValue([
      {
        id: 'fresh-in-flight',
        subscription: { paymentMethod: { gracePeriod: 14 } },
      },
      {
        id: 'stale-in-flight',
        subscription: { paymentMethod: { gracePeriod: 14 } },
      },
    ]);
    prismaMock.payment.findMany!.mockResolvedValue([
      { invoiceID: 'fresh-in-flight', createdAt: new Date('2026-06-10') },
      { invoiceID: 'stale-in-flight', createdAt: new Date('2026-05-01') },
    ]);

    const result =
      await subscriptionService.findUnpaidScheduledForDeactivationInvoices(
        runDate
      );

    expect(result.map(invoice => invoice.id)).toEqual(['stale-in-flight']);
  });

  it('invoice creation yearly', async () => {
    const paidUntil = add(new Date(), { days: 14 });
    const deactivationDate = add(paidUntil, { days: 10 });

    const mockSubscription = {
      id: 'sub-1',
      monthlyAmount: 10,
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil,
      startsAt: sub(paidUntil, { years: 3, days: -1 }),
      periods: [],
      memberPlan: mockMemberPlan,
      user: mockUser,
    };

    const mockInvoice = {
      id: 'invoice-1',
      dueAt: paidUntil,
      scheduledDeactivationAt: deactivationDate,
    };

    const mockPeriod = {
      id: 'period-1',
      startsAt: add(paidUntil, { days: 1 }),
      endsAt: add(paidUntil, { years: 1 }),
      amount: 120,
      paymentPeriodicity: PaymentPeriodicity.yearly,
    };

    prismaMock.invoice.create!.mockResolvedValue(mockInvoice);
    prismaMock.subscriptionPeriod.create!.mockResolvedValue(mockPeriod);

    await subscriptionService.createInvoice(
      mockSubscription as any,
      deactivationDate
    );

    expect(prismaMock.invoice.create).toHaveBeenCalled();
    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionPeriods: expect.objectContaining({
            create: expect.any(Object),
          }),
        }),
      })
    );
  });

  it('mark Invoice as paid (renewal)', async () => {
    const paidUntil = add(new Date(), { days: 5 });
    const mockSubscription = {
      id: 'sub-1',
      paidUntil,
      createdAt: sub(new Date(), { years: 1, days: 4 }),
      paymentPeriodicity: PaymentPeriodicity.yearly,
    };

    const mockInvoice = {
      id: 'invoice-1',
      paidAt: null,
      subscriptionID: 'sub-1',
      subscription: mockSubscription,
    };

    const updatedInvoice = {
      ...mockInvoice,
      paidAt: new Date(),
      subscription: {
        ...mockSubscription,
        paidUntil: add(paidUntil, { years: 1 }),
      },
    };

    prismaMock.invoice.findUnique!.mockResolvedValue(updatedInvoice);
    prismaMock.subscription.update!.mockResolvedValue(
      updatedInvoice.subscription
    );

    await subscriptionService.markInvoiceAsPaid(mockInvoice as any);

    expect(prismaMock.subscription.update).toHaveBeenCalled();
  });

  it('deactivate subscription', async () => {
    const mockSubscription = {
      id: 'sub-1',
      deactivation: null,
    };

    const mockInvoice = {
      id: 'invoice-1',
      canceledAt: null,
      subscriptionID: 'sub-1',
      subscription: mockSubscription,
    };

    const mockDeactivation = {
      id: 'deact-1',
      reason: SubscriptionDeactivationReason.invoiceNotPaid,
      date: new Date(),
    };

    prismaMock.subscriptionDeactivation.create!.mockResolvedValue(
      mockDeactivation
    );

    await subscriptionService.deactivateSubscription(mockInvoice as any);

    expect(prismaMock.subscriptionDeactivation.create).toHaveBeenCalled();
  });

  it('Charge invoice: Payment invalid payment provider', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: {
          paymentProviderID: 'invalid',
        },
      },
    };

    const actions: Action[] = [];

    try {
      await subscriptionService.chargeInvoice(mockInvoice as any, actions);
      throw Error('This execution should fail!');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: Payment Provider invalid not found!'
      );
    }
  });

  it('Charge invoice: No offsession payment provider', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: {
          paymentProviderID: 'payrexx',
        },
      },
    };

    const actions: Action[] = [];

    const answer = await subscriptionService.chargeInvoice(
      mockInvoice as any,
      actions
    );
    expect(answer.action).toBeUndefined();
    expect(answer.errorCode).toEqual('');
  });

  it('Get period start and and if no previous period exist', async () => {
    const res = await subscriptionService['getNextPeriod'](
      [],
      PaymentPeriodicity.monthly
    );
    expect(res.startsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), { minutes: -2, days: 1 }).getTime()
    );
    expect(res.startsAt.getTime()).toBeLessThanOrEqual(
      add(new Date(), { days: 1 }).getTime()
    );
    expect(res.endsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), { minutes: -2, months: 1 }).getTime()
    );
    expect(res.endsAt.getTime()).toBeLessThanOrEqual(
      add(new Date(), { months: 1 }).getTime()
    );
  });

  it('Offsession payment with canceled or already paid invoice', async () => {
    const date = new Date();
    try {
      await subscriptionService['offSessionPayment'](
        { canceledAt: date, paidAt: null } as any,
        {} as any,
        {} as any
      );
      throw Error('This execution should fail!');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew canceled invoice for subscription undefined`
      );
    }
    try {
      await subscriptionService['offSessionPayment'](
        { canceledAt: null, paidAt: date } as any,
        {} as any,
        {} as any
      );
      throw Error('This execution should fail!');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew paid invoice for subscription undefined`
      );
    }
  });

  it('Offsession payment invoice without subscription', async () => {
    try {
      const event: Action = {
        type: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: 1,
        externalMailTemplate: null,
      };
      await subscriptionService['offSessionPayment'](
        { canceledAt: null, paidAt: null } as any,
        {} as any,
        [event]
      );
      throw Error('This execution should fail!');
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: Subscription not found!'
      );
    }
  });

  it('checkInvoiceState skips a payment without throwing when its payment provider cannot be resolved', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: { paymentProviderID: 'payrexx' },
        memberPlan: {},
        user: { paymentProviderCustomers: [] },
      },
      items: [],
      subscriptionPeriods: [],
    };

    const findPaymentProviderByPaymentMethodeId = jest
      .fn()
      .mockResolvedValue(undefined);
    const paymentsService = {
      findByInvoiceId: jest
        .fn()
        .mockResolvedValue([
          { id: 'pay-1', intentID: 'intent-1', paymentMethodID: 'unknown' },
        ]),
      findPaymentProviderByPaymentMethodeId,
    };
    const subscriptionService = new SubscriptionService(
      prismaMock as any,
      paymentsService as any
    );

    await expect(
      subscriptionService.checkInvoiceState(mockInvoice as any)
    ).resolves.toBeUndefined();

    expect(findPaymentProviderByPaymentMethodeId).toHaveBeenCalledWith(
      'unknown'
    );
  });

  it("checkInvoiceState resolves the payment provider from each payment's own payment method", async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: { paymentProviderID: 'payrexx' },
        memberPlan: {},
        user: { paymentProviderCustomers: [] },
      },
      items: [],
      subscriptionPeriods: [],
    };

    const mockPayments = [
      { id: 'pay-1', intentID: 'pi_stripe', paymentMethodID: 'stripe-method' },
      { id: 'pay-2', intentID: null, paymentMethodID: 'payrexx-method' },
      { id: 'pay-3', intentID: '35123953', paymentMethodID: 'payrexx-method' },
    ];

    const stripeProvider = {
      checkIntentStatus: jest.fn().mockResolvedValue('stripe-state'),
      updatePaymentWithIntentState: jest.fn(),
      getName: () => 'stripe',
    };
    const payrexxProvider = {
      checkIntentStatus: jest.fn().mockResolvedValue('payrexx-state'),
      updatePaymentWithIntentState: jest.fn(),
      getName: () => 'payrexx',
    };
    const findPaymentProviderByPaymentMethodeId = jest.fn(
      async (paymentMethodID: string) =>
        paymentMethodID === 'stripe-method' ? stripeProvider : payrexxProvider
    );
    const paymentsService = {
      findByInvoiceId: jest.fn().mockResolvedValue(mockPayments),
      findPaymentProviderByPaymentMethodeId,
    };
    const subscriptionService = new SubscriptionService(
      prismaMock as any,
      paymentsService as any
    );

    await subscriptionService.checkInvoiceState(mockInvoice as any);

    expect(findPaymentProviderByPaymentMethodeId).toHaveBeenCalledWith(
      'stripe-method'
    );
    expect(findPaymentProviderByPaymentMethodeId).toHaveBeenCalledWith(
      'payrexx-method'
    );
    expect(stripeProvider.checkIntentStatus).toHaveBeenCalledWith({
      intentID: 'pi_stripe',
      paymentID: 'pay-1',
    });
    expect(payrexxProvider.checkIntentStatus).toHaveBeenCalledWith({
      intentID: '35123953',
      paymentID: 'pay-3',
    });
    expect(stripeProvider.updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState: 'stripe-state',
    });
    expect(payrexxProvider.updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState: 'payrexx-state',
    });
  });

  it('checkInvoiceState should skip payments without intentID', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: { paymentProviderID: 'payrexx' },
        memberPlan: {},
        user: { paymentProviderCustomers: [] },
      },
      items: [],
      subscriptionPeriods: [],
    };

    const mockPayments = [
      { id: 'pay-1', intentID: null, paymentMethodID: 'payrexx-method' },
      { id: 'pay-2', intentID: undefined, paymentMethodID: 'payrexx-method' },
    ];

    const findPaymentProviderByPaymentMethodeId = jest.fn();
    const paymentsService = {
      findByInvoiceId: jest.fn().mockResolvedValue(mockPayments),
      findPaymentProviderByPaymentMethodeId,
    };
    const subscriptionService = new SubscriptionService(
      prismaMock as any,
      paymentsService as any
    );

    await subscriptionService.checkInvoiceState(mockInvoice as any);

    expect(findPaymentProviderByPaymentMethodeId).not.toHaveBeenCalled();
  });

  it('checkInvoiceState skips updating the payment when checkIntentStatus returns null', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: { paymentProviderID: 'payrexx' },
        memberPlan: {},
        user: { paymentProviderCustomers: [] },
      },
      items: [],
      subscriptionPeriods: [],
    };

    const checkIntentStatus = jest.fn().mockResolvedValue(null);
    const updatePaymentWithIntentState = jest.fn();
    const paymentProvider = {
      checkIntentStatus,
      updatePaymentWithIntentState,
      getName: () => 'payrexx',
    };
    const paymentsService = {
      findByInvoiceId: jest.fn().mockResolvedValue([
        {
          id: 'pay-1',
          intentID: 'intent-1',
          paymentMethodID: 'payrexx-method',
        },
      ]),
      findPaymentProviderByPaymentMethodeId: jest
        .fn()
        .mockResolvedValue(paymentProvider),
    };
    const subscriptionService = new SubscriptionService(
      prismaMock as any,
      paymentsService as any
    );

    await subscriptionService.checkInvoiceState(mockInvoice as any);

    expect(checkIntentStatus).toHaveBeenCalledTimes(1);
    expect(updatePaymentWithIntentState).not.toHaveBeenCalled();
  });

  it('checkInvoiceState continues with the remaining payments when one payment check throws', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: { paymentProviderID: 'payrexx' },
        memberPlan: {},
        user: { paymentProviderCustomers: [] },
      },
      items: [],
      subscriptionPeriods: [],
    };

    const mockPayments = [
      { id: 'pay-1', intentID: 'pi_bad', paymentMethodID: 'payrexx-method' },
      { id: 'pay-2', intentID: '35123953', paymentMethodID: 'payrexx-method' },
    ];

    const checkIntentStatus = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'Payrexx request has error status with message: An error occurred: No Gateway found with id 0'
        )
      )
      .mockResolvedValueOnce('payrexx-state');
    const updatePaymentWithIntentState = jest.fn();
    const paymentProvider = {
      checkIntentStatus,
      updatePaymentWithIntentState,
      getName: () => 'payrexx',
    };
    const paymentsService = {
      findByInvoiceId: jest.fn().mockResolvedValue(mockPayments),
      findPaymentProviderByPaymentMethodeId: jest
        .fn()
        .mockResolvedValue(paymentProvider),
    };
    const subscriptionService = new SubscriptionService(
      prismaMock as any,
      paymentsService as any
    );

    await expect(
      subscriptionService.checkInvoiceState(mockInvoice as any)
    ).resolves.toBeUndefined();

    expect(checkIntentStatus).toHaveBeenCalledTimes(2);
    expect(updatePaymentWithIntentState).toHaveBeenCalledTimes(1);
    expect(updatePaymentWithIntentState).toHaveBeenCalledWith({
      intentState: 'payrexx-state',
    });
  });
});
