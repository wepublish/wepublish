import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  Currency,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
} from '@prisma/client';
import { MemberContextService } from '@wepublish/membership/api';
import { PaymentsService } from '@wepublish/payment/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { GiftCodeRedemptionAction } from './gift-code-redemption.model';
import {
  GIFT_CODE_REJECTED,
  GiftCodeRedemptionService,
} from './gift-code-redemption.service';

const NOW = new Date('2026-10-24T12:00:00.000Z');

type ById = { where: { id: string } };

const redeemable = {
  issuedAt: { not: null },
  canceledAt: null,
  redeemedAt: null,
  OR: [{ expiresAt: null }, { expiresAt: { gt: NOW } }],
};

const giftCode = (overrides: Record<string, unknown> = {}) => ({
  id: 'code-1',
  code: 'ABCDEFGHJKMN',
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
  autoRenew: false,
  renewalPaymentMethodId: null,
  issuedAt: new Date('2026-01-01T00:00:00.000Z'),
  expiresAt: null,
  canceledAt: null,
  redeemedAt: null,
  ...overrides,
});

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  userID: 'user-1',
  memberPlanID: 'plan-1',
  paymentPeriodicity: PaymentPeriodicity.yearly,
  paymentMethodID: 'pm-1',
  monthlyAmount: 1000,
  autoRenew: true,
  extendable: true,
  paidUntil: new Date('2026-12-31T00:00:00.000Z'),
  deactivation: null,
  periods: [],
  invoices: [
    {
      id: 'inv-old',
      paidAt: new Date('2025-12-01T00:00:00.000Z'),
      canceledAt: null,
    },
  ],
  ...overrides,
});

const openInvoice = { id: 'inv-open', paidAt: null, canceledAt: null };

const memberPlan = (overrides: Record<string, unknown> = {}) => ({
  id: 'plan-1',
  active: true,
  extendable: true,
  maxCount: null,
  currency: Currency.CHF,
  periodicityPricing: [
    {
      periodicity: PaymentPeriodicity.yearly,
      amountMin: 10000,
      amountTarget: 12000,
      amountMax: null,
    },
  ],
  availablePaymentMethods: [
    {
      paymentMethodIDs: ['pm-forced'],
      paymentPeriodicities: [PaymentPeriodicity.yearly],
      forceAutoRenewal: true,
    },
    {
      paymentMethodIDs: ['pm-monthly'],
      paymentPeriodicities: [PaymentPeriodicity.monthly],
      forceAutoRenewal: false,
    },
    {
      paymentMethodIDs: ['pm-inactive', 'pm-2', 'pm-3'],
      paymentPeriodicities: [
        PaymentPeriodicity.monthly,
        PaymentPeriodicity.yearly,
      ],
      forceAutoRenewal: false,
    },
  ],
  ...overrides,
});

const paymentMethods: Record<string, Record<string, unknown>> = {
  'pm-1': { id: 'pm-1', active: true, paymentProviderID: 'stripe' },
  'pm-2': { id: 'pm-2', active: true, paymentProviderID: 'stripe' },
  'pm-3': { id: 'pm-3', active: true, paymentProviderID: 'mollie' },
  'pm-forced': { id: 'pm-forced', active: true, paymentProviderID: 'stripe' },
  'pm-monthly': { id: 'pm-monthly', active: true, paymentProviderID: 'stripe' },
  'pm-inactive': {
    id: 'pm-inactive',
    active: false,
    paymentProviderID: 'stripe',
  },
};

const setup = () => {
  const prisma = {
    giftCode: {
      findFirst: vi.fn().mockResolvedValue(giftCode()),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    subscription: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockImplementation(async ({ where }: ById) => ({
        ...subscription(),
        id: where.id,
      })),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    invoice: {
      findUnique: vi.fn().mockImplementation(async ({ where }: ById) => ({
        id: where.id,
        paidAt: NOW,
        canceledAt: null,
        items: [],
      })),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    invoiceItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    subscriptionPeriod: {
      findFirst: vi
        .fn()
        .mockImplementation(
          async ({ where }: { where: { invoiceID: string } }) => ({
            id: 'period-next',
            invoiceID: where.invoiceID,
            startsAt: new Date('2027-01-01T00:00:00.000Z'),
            endsAt: new Date('2027-12-31T00:00:00.000Z'),
          })
        ),
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    payment: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    memberPlan: {
      findUnique: vi.fn().mockResolvedValue(memberPlan()),
    },
    paymentMethod: {
      findUnique: vi
        .fn()
        .mockImplementation(
          async ({ where }: ById) => paymentMethods[where.id] ?? null
        ),
    },
    settingPaymentProvider: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (operations: Promise<unknown>[]) =>
        Promise.all(operations)
      ),
  };
  const payments = {
    assertPaymentMethodSettleableWithoutCharge: vi
      .fn()
      .mockResolvedValue(undefined),
    assertSubscriptionInvoiceSettleable: vi.fn().mockResolvedValue(undefined),
    settleSubscriptionInvoiceWithoutCharge: vi
      .fn()
      .mockResolvedValue({ id: 'payment-1' }),
  };
  const memberContext = {
    renewSubscriptionForUser: vi.fn().mockResolvedValue({
      id: 'inv-next',
      dueAt: new Date('2027-01-01T00:00:00.000Z'),
      items: [],
    }),
    createSubscription: vi.fn().mockResolvedValue({
      subscription: { ...subscription(), id: 'sub-new' },
      invoice: { id: 'inv-new', items: [] },
    }),
    sendMailForSubscriptionEvent: vi.fn().mockResolvedValue(undefined),
  };
  const attempts = {
    reserve: vi.fn().mockResolvedValue(undefined),
    forget: vi.fn().mockResolvedValue(undefined),
  };

  const service = new GiftCodeRedemptionService(
    prisma as unknown as PrismaClient,
    payments as unknown as PaymentsService,
    memberContext as unknown as MemberContextService,
    new GiftCodeOfferService(
      prisma as unknown as PrismaClient,
      payments as unknown as PaymentsService
    ),
    attempts as unknown as GiftCodeAttemptLimiter
  );

  return { service, prisma, payments, memberContext, attempts };
};

type Setup = ReturnType<typeof setup>;

const expectRejected = (promise: Promise<unknown>) =>
  expect(promise).rejects.toThrow(new BadRequestException(GIFT_CODE_REJECTED));

const expectCodeUntouched = ({ prisma, payments }: Setup) => {
  expect(prisma.giftCode.updateMany).not.toHaveBeenCalled();
  expect(
    payments.settleSubscriptionInvoiceWithoutCharge
  ).not.toHaveBeenCalled();
};

const expectNothingDeleted = ({ prisma }: Setup) => {
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(prisma.invoice.deleteMany).not.toHaveBeenCalled();
  expect(prisma.subscription.deleteMany).not.toHaveBeenCalled();
};

const expectInvoiceDeleted = ({ prisma }: Setup, invoiceId: string) => {
  expect(prisma.payment.deleteMany).toHaveBeenCalledWith({
    where: { invoiceID: invoiceId },
  });
  expect(prisma.subscriptionPeriod.deleteMany).toHaveBeenCalledWith({
    where: { invoiceID: invoiceId },
  });
  expect(prisma.invoiceItem.deleteMany).toHaveBeenCalledWith({
    where: { invoiceId },
  });
  expect(prisma.invoice.deleteMany).toHaveBeenCalledWith({
    where: { id: invoiceId },
  });
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
};

describe('GiftCodeRedemptionService.redeem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('the code', () => {
    it('counts the attempt before it looks at the code', async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.attempts.reserve).toHaveBeenCalledWith('user-1');
      expect(ctx.attempts.reserve.mock.invocationCallOrder[0]).toBeLessThan(
        ctx.prisma.giftCode.findFirst.mock.invocationCallOrder[0]
      );
    });

    it('stops when the user made too many attempts', async () => {
      const ctx = setup();
      ctx.attempts.reserve.mockRejectedValue(
        new ForbiddenException('Too many')
      );

      await expect(
        ctx.service.redeem('user-1', 'ABCDEFGHJKMN')
      ).rejects.toThrow(ForbiddenException);
      expect(ctx.prisma.giftCode.findFirst).not.toHaveBeenCalled();
      expectCodeUntouched(ctx);
    });

    it('rejects input that is no code with the generic error', async () => {
      const ctx = setup();

      await expectRejected(ctx.service.redeem('user-1', 'nope'));
      expect(ctx.prisma.giftCode.findFirst).not.toHaveBeenCalled();
      expect(ctx.attempts.forget).not.toHaveBeenCalled();
    });

    it('looks the normalized code up only while it is issued, not canceled, not redeemed and not expired', async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'abcd-efgh jkmn');

      expect(ctx.prisma.giftCode.findFirst).toHaveBeenCalledWith({
        where: { code: 'ABCDEFGHJKMN', ...redeemable },
      });
    });

    it('rejects an unknown, used, canceled or expired code with the generic error and touches nothing', async () => {
      const ctx = setup();
      ctx.prisma.giftCode.findFirst.mockResolvedValue(null);

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expect(ctx.prisma.subscription.findMany).not.toHaveBeenCalled();
      expect(ctx.memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
      expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
      expectCodeUntouched(ctx);
      expect(ctx.attempts.forget).not.toHaveBeenCalled();
    });
  });

  describe('a fitting subscription', () => {
    it("only looks at the user's extendable subscriptions of the code's plan and periodicity that have no deactivation at all, also none in the future", async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userID: 'user-1',
            memberPlanID: 'plan-1',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            extendable: true,
            deactivation: null,
          },
        })
      );
    });

    it('pays the open invoice of a fitting subscription', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.renewSubscriptionForUser).toHaveBeenCalledWith({
        subscription: expect.objectContaining({ id: 'sub-1' }),
      });
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'code-1', ...redeemable },
        data: {
          redeemedAt: NOW,
          redeemedByUserId: 'user-1',
          redeemedSubscriptionId: 'sub-1',
          redeemedInvoiceId: 'inv-open',
        },
      });
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).toHaveBeenCalledWith('inv-open');
      expect(result).toEqual({
        action: GiftCodeRedemptionAction.paidInvoice,
        subscription: expect.objectContaining({ id: 'sub-1' }),
        invoice: expect.objectContaining({ id: 'inv-open', paidAt: NOW }),
      });
      expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
      expectNothingDeleted(ctx);
    });

    it('checks the open invoice and the payment method before it claims the code', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(
        ctx.payments.assertPaymentMethodSettleableWithoutCharge
      ).toHaveBeenCalledWith('pm-1');
      expect(
        ctx.payments.assertSubscriptionInvoiceSettleable
      ).toHaveBeenCalledWith('inv-open');
      expect(
        ctx.payments.assertSubscriptionInvoiceSettleable.mock
          .invocationCallOrder[0]
      ).toBeLessThan(
        ctx.prisma.giftCode.updateMany.mock.invocationCallOrder[0]
      );
    });

    it('rejects with the generic error and keeps the code when the open invoice cannot be paid', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });
      ctx.payments.assertSubscriptionInvoiceSettleable.mockRejectedValue(
        new BadRequestException('payment running')
      );

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectCodeUntouched(ctx);
      expectNothingDeleted(ctx);
    });

    it('extends a fitting subscription without open invoice by the next period', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.renewSubscriptionForUser).toHaveBeenCalledWith({
        subscription: expect.objectContaining({
          id: 'sub-1',
          paidUntil: new Date('2026-12-31T00:00:00.000Z'),
        }),
      });
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'code-1', ...redeemable },
        data: {
          redeemedAt: NOW,
          redeemedByUserId: 'user-1',
          redeemedSubscriptionId: 'sub-1',
          redeemedInvoiceId: 'inv-next',
        },
      });
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).toHaveBeenCalledWith('inv-next');
      expect(result).toEqual({
        action: GiftCodeRedemptionAction.extendedSubscription,
        subscription: expect.objectContaining({ id: 'sub-1' }),
        invoice: expect.objectContaining({ id: 'inv-next', paidAt: NOW }),
      });
      expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
      expectNothingDeleted(ctx);
    });

    it('checks the payment method before it creates the next invoice', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(
        ctx.payments.assertPaymentMethodSettleableWithoutCharge
      ).toHaveBeenCalledWith('pm-1');
      expect(
        ctx.payments.assertPaymentMethodSettleableWithoutCharge.mock
          .invocationCallOrder[0]
      ).toBeLessThan(
        ctx.memberContext.renewSubscriptionForUser.mock.invocationCallOrder[0]
      );
    });

    it('refuses a subscription that its payment provider charges on its own with the generic error, before anything is created', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.payments.assertPaymentMethodSettleableWithoutCharge.mockRejectedValue(
        new BadRequestException('charged by its payment provider')
      );

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expect(ctx.memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
      expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
      expectCodeUntouched(ctx);
    });

    it('rejects with the generic error when the subscription cannot be renewed', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue(null);

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectCodeUntouched(ctx);
    });

    it('checks the next period against the periods of the subscription whose invoice is not canceled', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.subscriptionPeriod.findFirst).toHaveBeenCalledWith({
        where: { invoiceID: 'inv-next' },
      });
      expect(ctx.prisma.subscriptionPeriod.count).toHaveBeenCalledWith({
        where: {
          subscriptionId: 'sub-1',
          invoiceID: { not: 'inv-next' },
          startsAt: { lte: new Date('2027-12-31T00:00:00.000Z') },
          endsAt: { gte: new Date('2027-01-01T00:00:00.000Z') },
          invoice: { canceledAt: null },
        },
      });
      expect(
        ctx.prisma.subscriptionPeriod.count.mock.invocationCallOrder[0]
      ).toBeLessThan(
        ctx.prisma.giftCode.updateMany.mock.invocationCallOrder[0]
      );
    });

    it('refuses with the generic error and removes the next invoice when a parallel redemption or renewal already covers that period', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.prisma.subscriptionPeriod.count.mockResolvedValue(1);
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-next',
        paidAt: null,
        canceledAt: null,
      });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectCodeUntouched(ctx);
      expectInvoiceDeleted(ctx, 'inv-next');
      expect(ctx.prisma.subscription.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses with the generic error and removes the next invoice when it has no period', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.prisma.subscriptionPeriod.findFirst.mockResolvedValue(null);
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-next',
        paidAt: null,
        canceledAt: null,
      });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectCodeUntouched(ctx);
      expectInvoiceDeleted(ctx, 'inv-next');
    });

    it('does not look at periods when it pays an open invoice that existed before', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.subscriptionPeriod.count).not.toHaveBeenCalled();
    });

    it('prefers a fitting subscription with an open invoice', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({
          id: 'sub-ahead',
          paidUntil: new Date('2028-01-01T00:00:00.000Z'),
        }),
        subscription({ id: 'sub-open', invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.renewSubscriptionForUser).toHaveBeenCalledWith({
        subscription: expect.objectContaining({ id: 'sub-open' }),
      });
      expect(result.action).toBe(GiftCodeRedemptionAction.paidInvoice);
    });

    it('otherwise picks the fitting subscription that is paid furthest ahead', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ id: 'sub-unpaid', paidUntil: null }),
        subscription({
          id: 'sub-ahead',
          paidUntil: new Date('2028-01-01T00:00:00.000Z'),
        }),
        subscription({
          id: 'sub-behind',
          paidUntil: new Date('2027-01-01T00:00:00.000Z'),
        }),
      ]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.renewSubscriptionForUser).toHaveBeenCalledWith({
        subscription: expect.objectContaining({ id: 'sub-ahead' }),
      });
    });

    it.each([
      ['without an open invoice', []],
      ['with an open invoice', [openInvoice]],
    ])(
      'refuses a fitting lifetime subscription %s with the generic error before anything is created or paid',
      async (_, invoices) => {
        const ctx = setup();
        ctx.prisma.giftCode.findFirst.mockResolvedValue(
          giftCode({ periodicity: PaymentPeriodicity.lifetime })
        );
        ctx.prisma.subscription.findMany.mockResolvedValue([
          subscription({
            paymentPeriodicity: PaymentPeriodicity.lifetime,
            invoices,
          }),
        ]);

        await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
        expect(
          ctx.memberContext.renewSubscriptionForUser
        ).not.toHaveBeenCalled();
        expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
        expect(
          ctx.payments.assertSubscriptionInvoiceSettleable
        ).not.toHaveBeenCalled();
        expectCodeUntouched(ctx);
        expectNothingDeleted(ctx);
        expect(ctx.attempts.forget).not.toHaveBeenCalled();
      }
    );

    it('does not count a deactivated lifetime subscription as fitting and starts a new one', async () => {
      const ctx = setup();
      const stored = [
        subscription({
          paymentPeriodicity: PaymentPeriodicity.lifetime,
          deactivation: {
            id: 'deactivation-1',
            subscriptionID: 'sub-1',
            date: new Date('2026-06-01T00:00:00.000Z'),
            reason: SubscriptionDeactivationReason.userSelfDeactivated,
          },
        }),
      ];
      ctx.prisma.giftCode.findFirst.mockResolvedValue(
        giftCode({ periodicity: PaymentPeriodicity.lifetime })
      );
      ctx.prisma.subscription.findMany.mockImplementation(
        async ({ where }: { where: { deactivation?: null } }) =>
          stored.filter(
            ({ deactivation }) =>
              where.deactivation !== null || deactivation === null
          )
      );
      ctx.prisma.memberPlan.findUnique.mockResolvedValue(
        memberPlan({
          periodicityPricing: [
            {
              periodicity: PaymentPeriodicity.lifetime,
              amountMin: 60000,
              amountTarget: null,
              amountMax: null,
            },
          ],
          availablePaymentMethods: [
            {
              paymentMethodIDs: ['pm-2'],
              paymentPeriodicities: [PaymentPeriodicity.lifetime],
              forceAutoRenewal: false,
            },
          ],
        })
      );

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
      expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: 'user-1',
          memberPlanID: 'plan-1',
          paymentPeriodicity: PaymentPeriodicity.lifetime,
          paymentMethodID: 'pm-2',
        })
      );
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).toHaveBeenCalledWith('inv-new');
      expect(result.action).toBe(GiftCodeRedemptionAction.createdSubscription);
    });

    it('never changes the payment method of the subscription', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.subscription.update).not.toHaveBeenCalled();
      expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleaning up after a lost claim or a failed settle', () => {
    it('deletes the freshly created invoice and its period when the claim is lost', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.prisma.giftCode.updateMany.mockResolvedValue({ count: 0 });
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-next',
        paidAt: null,
        canceledAt: null,
      });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectInvoiceDeleted(ctx, 'inv-next');
      expect(ctx.prisma.subscription.deleteMany).not.toHaveBeenCalled();
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).not.toHaveBeenCalled();
      expect(ctx.attempts.forget).not.toHaveBeenCalled();
    });

    it('keeps a freshly created invoice that another code claimed in the meantime', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.prisma.giftCode.updateMany.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
      );
      ctx.prisma.giftCode.count.mockResolvedValue(1);
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-next',
        paidAt: null,
        canceledAt: null,
      });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expect(ctx.prisma.giftCode.count).toHaveBeenCalledWith({
        where: { OR: [{ redeemedInvoiceId: 'inv-next' }] },
      });
      expectNothingDeleted(ctx);
    });

    it('never deletes an open invoice that existed before', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });
      ctx.prisma.giftCode.updateMany.mockResolvedValue({ count: 0 });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectNothingDeleted(ctx);
    });

    it('rejects a claim on a vanished invoice with the generic error', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });
      ctx.prisma.giftCode.updateMany.mockRejectedValue(
        Object.assign(new Error('Foreign key constraint failed'), {
          code: 'P2003',
        })
      );

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
    });

    it('passes on other database errors of the claim', async () => {
      const ctx = setup();
      const error = new Error('connection lost');
      ctx.prisma.giftCode.updateMany.mockRejectedValue(error);

      await expect(ctx.service.redeem('user-1', 'ABCDEFGHJKMN')).rejects.toBe(
        error
      );
    });

    it('releases the claim and deletes the freshly created invoice when settling fails', async () => {
      const ctx = setup();
      const error = new Error('settling failed');
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(
        error
      );
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-next',
        paidAt: null,
        canceledAt: null,
      });

      await expect(ctx.service.redeem('user-1', 'ABCDEFGHJKMN')).rejects.toBe(
        error
      );
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenLastCalledWith({
        where: {
          id: 'code-1',
          redeemedInvoiceId: 'inv-next',
          redeemedAt: NOW,
        },
        data: {
          redeemedAt: null,
          redeemedByUserId: null,
          redeemedSubscriptionId: null,
          redeemedInvoiceId: null,
        },
      });
      expectInvoiceDeleted(ctx, 'inv-next');
      expect(ctx.attempts.forget).not.toHaveBeenCalled();
    });

    it('releases the claim but keeps an open invoice that existed before when settling fails', async () => {
      const ctx = setup();
      const error = new Error('settling failed');
      ctx.prisma.subscription.findMany.mockResolvedValue([
        subscription({ invoices: [openInvoice] }),
      ]);
      ctx.memberContext.renewSubscriptionForUser.mockResolvedValue({
        ...openInvoice,
        items: [],
      });
      ctx.payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(
        error
      );
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        ...openInvoice,
      });

      await expect(ctx.service.redeem('user-1', 'ABCDEFGHJKMN')).rejects.toBe(
        error
      );
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenCalledTimes(2);
      expectNothingDeleted(ctx);
    });

    it('keeps the claim and reports success when the invoice got paid before settling failed', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);
      ctx.payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(
        new Error('mail failed')
      );

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(result.action).toBe(GiftCodeRedemptionAction.extendedSubscription);
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenCalledTimes(1);
      expectNothingDeleted(ctx);
      expect(ctx.attempts.forget).toHaveBeenCalledWith('user-1');
    });
  });

  describe('no fitting subscription', () => {
    it('creates a subscription for the code and pays its first invoice', async () => {
      const ctx = setup();

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith({
        userID: 'user-1',
        memberPlanID: 'plan-1',
        paymentPeriodicity: PaymentPeriodicity.yearly,
        paymentMethodID: 'pm-2',
        monthlyAmount: 1000,
        autoRenew: false,
        extendable: true,
        properties: [],
        skipMail: true,
      });
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'code-1', ...redeemable },
        data: {
          redeemedAt: NOW,
          redeemedByUserId: 'user-1',
          redeemedSubscriptionId: 'sub-new',
          redeemedInvoiceId: 'inv-new',
        },
      });
      expect(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge
      ).toHaveBeenCalledWith('inv-new');
      expect(result).toEqual({
        action: GiftCodeRedemptionAction.createdSubscription,
        subscription: expect.objectContaining({ id: 'sub-new' }),
        invoice: expect.objectContaining({ id: 'inv-new', paidAt: NOW }),
      });
      expect(ctx.memberContext.renewSubscriptionForUser).not.toHaveBeenCalled();
      expectNothingDeleted(ctx);
    });

    it('starts a subscription that renews automatically with the renewal payment method of the code', async () => {
      const ctx = setup();
      ctx.prisma.giftCode.findFirst.mockResolvedValue(
        giftCode({ autoRenew: true, renewalPaymentMethodId: 'pm-forced' })
      );

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodID: 'pm-forced',
          autoRenew: true,
        })
      );
    });

    it('picks the first active, not retired method the plan offers for the periodicity without forced auto renewal', async () => {
      const ctx = setup();
      ctx.prisma.settingPaymentProvider.findMany.mockResolvedValue([
        { id: 'stripe' },
      ]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethodID: 'pm-3' })
      );
    });

    it('skips a method whose provider charges subscriptions on its own', async () => {
      const ctx = setup();
      ctx.payments.assertPaymentMethodSettleableWithoutCharge.mockImplementation(
        async (id: string) => {
          if (id === 'pm-2') {
            throw new BadRequestException('charged by its payment provider');
          }
        }
      );

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethodID: 'pm-3' })
      );
    });

    it.each([
      ['the target amount', { amountMin: 10000, amountTarget: 12000 }, 1000],
      [
        'the minimum without a target amount',
        { amountMin: 9000, amountTarget: null },
        750,
      ],
    ])(
      'takes the monthly amount from %s of the plan price',
      async (_, price, monthlyAmount) => {
        const ctx = setup();
        ctx.prisma.memberPlan.findUnique.mockResolvedValue(
          memberPlan({
            periodicityPricing: [
              {
                periodicity: PaymentPeriodicity.yearly,
                amountMax: null,
                ...price,
              },
            ],
          })
        );

        await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

        expect(ctx.memberContext.createSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ monthlyAmount })
        );
      }
    );

    it('loads the plan with its prices and payment methods', async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.memberPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: { periodicityPricing: true, availablePaymentMethods: true },
      });
    });

    it.each<[string, (ctx: Setup) => void]>([
      [
        'the plan is gone',
        ctx => ctx.prisma.memberPlan.findUnique.mockResolvedValue(null),
      ],
      [
        'the plan is inactive',
        ctx =>
          ctx.prisma.memberPlan.findUnique.mockResolvedValue(
            memberPlan({ active: false })
          ),
      ],
      [
        'the user reached the maximum number of subscriptions of the plan',
        ctx => {
          ctx.prisma.memberPlan.findUnique.mockResolvedValue(
            memberPlan({ maxCount: 2 })
          );
          ctx.prisma.subscription.count.mockResolvedValue(2);
        },
      ],
      [
        'the plan has no price',
        ctx =>
          ctx.prisma.memberPlan.findUnique.mockResolvedValue(
            memberPlan({ periodicityPricing: [] })
          ),
      ],
      [
        'the plan offers no usable payment method for the periodicity',
        ctx =>
          ctx.prisma.memberPlan.findUnique.mockResolvedValue(
            memberPlan({
              availablePaymentMethods: [
                {
                  paymentMethodIDs: ['pm-monthly'],
                  paymentPeriodicities: [PaymentPeriodicity.monthly],
                  forceAutoRenewal: false,
                },
                {
                  paymentMethodIDs: ['pm-inactive', 'pm-missing'],
                  paymentPeriodicities: [PaymentPeriodicity.yearly],
                  forceAutoRenewal: false,
                },
              ],
            })
          ),
      ],
      [
        'the code renews automatically but its renewal payment method is gone',
        ctx =>
          ctx.prisma.giftCode.findFirst.mockResolvedValue(
            giftCode({ autoRenew: true, renewalPaymentMethodId: null })
          ),
      ],
      [
        'the plan no longer offers the renewal payment method',
        ctx =>
          ctx.prisma.giftCode.findFirst.mockResolvedValue(
            giftCode({ autoRenew: true, renewalPaymentMethodId: 'pm-monthly' })
          ),
      ],
      [
        'the renewal payment method is inactive',
        ctx =>
          ctx.prisma.giftCode.findFirst.mockResolvedValue(
            giftCode({ autoRenew: true, renewalPaymentMethodId: 'pm-inactive' })
          ),
      ],
      [
        'the renewal payment method is charged by its provider',
        ctx => {
          ctx.prisma.giftCode.findFirst.mockResolvedValue(
            giftCode({ autoRenew: true, renewalPaymentMethodId: 'pm-2' })
          );
          ctx.payments.assertPaymentMethodSettleableWithoutCharge.mockRejectedValue(
            new BadRequestException('charged by its payment provider')
          );
        },
      ],
      [
        'the code renews automatically but the plan cannot be extended any more',
        ctx => {
          ctx.prisma.giftCode.findFirst.mockResolvedValue(
            giftCode({ autoRenew: true, renewalPaymentMethodId: 'pm-2' })
          );
          ctx.prisma.memberPlan.findUnique.mockResolvedValue(
            memberPlan({ extendable: false })
          );
        },
      ],
    ])(
      'refuses with the generic error and keeps the code when %s',
      async (_, arrange) => {
        const ctx = setup();
        arrange(ctx);

        await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
        expect(ctx.memberContext.createSubscription).not.toHaveBeenCalled();
        expectCodeUntouched(ctx);
        expectNothingDeleted(ctx);
      }
    );

    it('counts the subscriptions of the user on the plan for the maximum', async () => {
      const ctx = setup();
      ctx.prisma.memberPlan.findUnique.mockResolvedValue(
        memberPlan({ maxCount: 2 })
      );
      ctx.prisma.subscription.count.mockResolvedValue(1);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.prisma.subscription.count).toHaveBeenCalledWith({
        where: { userID: 'user-1', memberPlanID: 'plan-1' },
      });
      expect(ctx.memberContext.createSubscription).toHaveBeenCalled();
    });

    it('rejects with the generic error and keeps the code when the subscription cannot be created', async () => {
      const ctx = setup();
      ctx.memberContext.createSubscription.mockRejectedValue(
        new Error('Subscription count exceeded limit')
      );

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expectCodeUntouched(ctx);
    });

    it('removes the created subscription again when the claim is lost', async () => {
      const ctx = setup();
      ctx.prisma.giftCode.updateMany.mockResolvedValue({ count: 0 });
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-new',
        paidAt: null,
        canceledAt: null,
      });

      await expectRejected(ctx.service.redeem('user-1', 'ABCDEFGHJKMN'));
      expect(ctx.prisma.giftCode.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { redeemedInvoiceId: 'inv-new' },
            { redeemedSubscriptionId: 'sub-new' },
          ],
        },
      });
      expectInvoiceDeleted(ctx, 'inv-new');
      expect(ctx.prisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { id: 'sub-new' },
      });
      expect(
        ctx.memberContext.sendMailForSubscriptionEvent
      ).not.toHaveBeenCalled();
    });

    it('releases the claim and removes the created subscription when settling fails', async () => {
      const ctx = setup();
      const error = new Error('settling failed');
      ctx.payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(
        error
      );
      ctx.prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-new',
        paidAt: null,
        canceledAt: null,
      });

      await expect(ctx.service.redeem('user-1', 'ABCDEFGHJKMN')).rejects.toBe(
        error
      );
      expect(ctx.prisma.giftCode.updateMany).toHaveBeenLastCalledWith({
        where: { id: 'code-1', redeemedInvoiceId: 'inv-new', redeemedAt: NOW },
        data: {
          redeemedAt: null,
          redeemedByUserId: null,
          redeemedSubscriptionId: null,
          redeemedInvoiceId: null,
        },
      });
      expectInvoiceDeleted(ctx, 'inv-new');
      expect(ctx.prisma.subscription.deleteMany).toHaveBeenCalledWith({
        where: { id: 'sub-new' },
      });
      expect(
        ctx.memberContext.sendMailForSubscriptionEvent
      ).not.toHaveBeenCalled();
    });

    it('sends the subscribe mail only after the code paid the new subscription', async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(
        ctx.memberContext.sendMailForSubscriptionEvent
      ).toHaveBeenCalledWith(
        SubscriptionEvent.SUBSCRIBE,
        expect.objectContaining({ id: 'sub-new' }),
        {}
      );
      expect(
        ctx.memberContext.sendMailForSubscriptionEvent.mock
          .invocationCallOrder[0]
      ).toBeGreaterThan(
        ctx.payments.settleSubscriptionInvoiceWithoutCharge.mock
          .invocationCallOrder[0]
      );
    });

    it('still reports success when the subscribe mail fails', async () => {
      const ctx = setup();
      ctx.memberContext.sendMailForSubscriptionEvent.mockRejectedValue(
        new Error('mail provider down')
      );

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(result.action).toBe(GiftCodeRedemptionAction.createdSubscription);
    });

    it('sends no subscribe mail when it paid an existing subscription', async () => {
      const ctx = setup();
      ctx.prisma.subscription.findMany.mockResolvedValue([subscription()]);

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(
        ctx.memberContext.sendMailForSubscriptionEvent
      ).not.toHaveBeenCalled();
    });
  });

  describe('afterwards', () => {
    it('forgets the attempts after a success', async () => {
      const ctx = setup();

      await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(ctx.attempts.forget).toHaveBeenCalledWith('user-1');
    });

    it('returns what happened, the subscription and the invoice, but never the gift code', async () => {
      const ctx = setup();

      const result = await ctx.service.redeem('user-1', 'ABCDEFGHJKMN');

      expect(Object.keys(result).sort()).toEqual([
        'action',
        'invoice',
        'subscription',
      ]);
      expect(ctx.prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: 'sub-new' },
      });
      expect(ctx.prisma.invoice.findUnique).toHaveBeenLastCalledWith({
        where: { id: 'inv-new' },
        include: { items: true },
      });
    });
  });
});
