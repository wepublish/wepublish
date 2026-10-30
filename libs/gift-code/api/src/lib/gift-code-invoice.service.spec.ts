import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentPeriodicity, PrismaClient, SellableKind } from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import {
  GIFT_CODE_REJECTED,
  GiftCodeInvoiceService,
} from './gift-code-invoice.service';

const NOW = new Date('2026-10-24T12:00:00.000Z');

const subscription = {
  id: 'sub-1',
  userID: 'user-1',
  memberPlanID: 'plan-1',
  paymentPeriodicity: PaymentPeriodicity.yearly,
};

const invoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  subscriptionID: 'sub-1',
  sellableKind: null,
  paidAt: null,
  canceledAt: null,
  subscription,
  ...overrides,
});

const claimWhere = {
  code: 'ABCDEFGHJKMN',
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
  issuedAt: { not: null },
  canceledAt: null,
  redeemedAt: null,
  OR: [{ expiresAt: null }, { expiresAt: { gt: NOW } }],
};

const setup = () => {
  const paidInvoice = { ...invoice(), paidAt: NOW, items: [] };
  const prisma = {
    invoice: {
      findUnique: vi
        .fn()
        .mockResolvedValueOnce(invoice())
        .mockResolvedValue(paidInvoice),
    },
    giftCode: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const payments = {
    assertSubscriptionInvoiceSettleable: vi.fn().mockResolvedValue(undefined),
    settleSubscriptionInvoiceWithoutCharge: vi
      .fn()
      .mockResolvedValue({ id: 'payment-1' }),
  };
  const attempts = {
    reserve: vi.fn().mockResolvedValue(undefined),
    forget: vi.fn().mockResolvedValue(undefined),
  };

  const service = new GiftCodeInvoiceService(
    prisma as unknown as PrismaClient,
    payments as unknown as PaymentsService,
    attempts as unknown as GiftCodeAttemptLimiter
  );

  return { service, prisma, payments, attempts, paidInvoice };
};

describe('GiftCodeInvoiceService.payInvoice', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('claims a matching code and pays the invoice through the paid pipeline', async () => {
    const { service, prisma, payments, paidInvoice } = setup();

    const result = await service.payInvoice('user-1', {
      invoiceId: 'inv-1',
      code: 'abcd-efgh jkmn',
    });

    expect(prisma.invoice.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'inv-1' },
      include: { subscription: true },
    });
    expect(prisma.giftCode.updateMany).toHaveBeenCalledWith({
      where: claimWhere,
      data: {
        redeemedAt: NOW,
        redeemedByUserId: 'user-1',
        redeemedSubscriptionId: 'sub-1',
        redeemedInvoiceId: 'inv-1',
      },
    });
    expect(
      payments.settleSubscriptionInvoiceWithoutCharge
    ).toHaveBeenCalledWith('inv-1');
    expect(prisma.invoice.findUnique).toHaveBeenLastCalledWith({
      where: { id: 'inv-1' },
      include: { items: true },
    });
    expect(result).toBe(paidInvoice);
  });

  it('claims before it settles', async () => {
    const { service, prisma, payments } = setup();

    await service.payInvoice('user-1', {
      invoiceId: 'inv-1',
      code: 'ABCDEFGHJKMN',
    });

    expect(prisma.giftCode.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      payments.settleSubscriptionInvoiceWithoutCharge.mock
        .invocationCallOrder[0]
    );
  });

  it('checks that the invoice can be paid before it claims the code', async () => {
    const { service, prisma, payments } = setup();

    await service.payInvoice('user-1', {
      invoiceId: 'inv-1',
      code: 'ABCDEFGHJKMN',
    });

    expect(payments.assertSubscriptionInvoiceSettleable).toHaveBeenCalledWith(
      'inv-1'
    );
    expect(
      payments.assertSubscriptionInvoiceSettleable.mock.invocationCallOrder[0]
    ).toBeLessThan(prisma.giftCode.updateMany.mock.invocationCallOrder[0]);
  });

  it('does not touch the code when the invoice cannot be paid', async () => {
    const { service, prisma, payments } = setup();
    const error = new BadRequestException('payment running');
    payments.assertSubscriptionInvoiceSettleable.mockRejectedValue(error);

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toBe(error);
    expect(prisma.giftCode.updateMany).not.toHaveBeenCalled();
    expect(
      payments.settleSubscriptionInvoiceWithoutCharge
    ).not.toHaveBeenCalled();
  });

  it('counts the attempt first and forgets the attempts after a success', async () => {
    const { service, prisma, attempts } = setup();

    await service.payInvoice('user-1', {
      invoiceId: 'inv-1',
      code: 'ABCDEFGHJKMN',
    });

    expect(attempts.reserve).toHaveBeenCalledWith('user-1');
    expect(attempts.reserve.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.invoice.findUnique.mock.invocationCallOrder[0]
    );
    expect(attempts.forget).toHaveBeenCalledWith('user-1');
  });

  it('stops when the user made too many attempts', async () => {
    const { service, prisma, attempts } = setup();
    attempts.reserve.mockRejectedValue(new ForbiddenException('Too many'));

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.invoice.findUnique).not.toHaveBeenCalled();
    expect(prisma.giftCode.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing invoice', null],
    [
      'an invoice of another user',
      invoice({ subscription: { ...subscription, userID: 'user-2' } }),
    ],
    [
      'an invoice without subscription',
      invoice({ subscriptionID: null, subscription: null }),
    ],
    ['a sellable invoice', invoice({ sellableKind: SellableKind.giftCode })],
    ['a paid invoice', invoice({ paidAt: NOW })],
    ['a canceled invoice', invoice({ canceledAt: NOW })],
  ])('rejects %s without touching a code', async (_, found) => {
    const { service, prisma, payments } = setup();
    prisma.invoice.findUnique.mockReset().mockResolvedValue(found);

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.giftCode.updateMany).not.toHaveBeenCalled();
    expect(
      payments.settleSubscriptionInvoiceWithoutCharge
    ).not.toHaveBeenCalled();
  });

  it('rejects input that is no code with the generic error', async () => {
    const { service, prisma, attempts } = setup();

    await expect(
      service.payInvoice('user-1', { invoiceId: 'inv-1', code: 'nope' })
    ).rejects.toThrow(new BadRequestException(GIFT_CODE_REJECTED));
    expect(prisma.giftCode.updateMany).not.toHaveBeenCalled();
    expect(attempts.forget).not.toHaveBeenCalled();
  });

  it('rejects an unknown, used, canceled, expired or mismatched code with the same generic error', async () => {
    const { service, prisma, payments, attempts } = setup();
    prisma.giftCode.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toThrow(new BadRequestException(GIFT_CODE_REJECTED));
    expect(
      payments.settleSubscriptionInvoiceWithoutCharge
    ).not.toHaveBeenCalled();
    expect(attempts.forget).not.toHaveBeenCalled();
  });

  it('rejects a second code for an invoice that another code already paid', async () => {
    const { service, prisma, payments } = setup();
    prisma.giftCode.updateMany.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    );

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toThrow(BadRequestException);
    expect(
      payments.settleSubscriptionInvoiceWithoutCharge
    ).not.toHaveBeenCalled();
  });

  it('passes on other database errors of the claim', async () => {
    const { service, prisma } = setup();
    const error = new Error('connection lost');
    prisma.giftCode.updateMany.mockRejectedValue(error);

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toBe(error);
  });

  it('releases the claim when the invoice could not be settled', async () => {
    const { service, prisma, payments, attempts } = setup();
    const error = new Error('settling failed');
    payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(error);
    prisma.invoice.findUnique
      .mockReset()
      .mockResolvedValueOnce(invoice())
      .mockResolvedValue(invoice());

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).rejects.toBe(error);
    expect(prisma.giftCode.updateMany).toHaveBeenLastCalledWith({
      where: { redeemedInvoiceId: 'inv-1', redeemedAt: NOW },
      data: {
        redeemedAt: null,
        redeemedByUserId: null,
        redeemedSubscriptionId: null,
        redeemedInvoiceId: null,
      },
    });
    expect(attempts.forget).not.toHaveBeenCalled();
  });

  it('keeps the claim and reports success when the invoice got paid before settling failed', async () => {
    const { service, prisma, payments, attempts, paidInvoice } = setup();
    payments.settleSubscriptionInvoiceWithoutCharge.mockRejectedValue(
      new Error('mail failed')
    );

    await expect(
      service.payInvoice('user-1', {
        invoiceId: 'inv-1',
        code: 'ABCDEFGHJKMN',
      })
    ).resolves.toBe(paidInvoice);
    expect(prisma.giftCode.updateMany).toHaveBeenCalledTimes(1);
    expect(attempts.forget).toHaveBeenCalledWith('user-1');
  });
});
