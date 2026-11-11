import { BadRequestException } from '@nestjs/common';
import { Currency, Prisma, SellableKind } from '@prisma/client';
import { addDays } from 'date-fns';
import { SellableLineDraft } from './sellable-handler';
import { SellableCheckoutService } from './sellable-checkout.service';

const NOW = new Date('2026-10-24T10:00:00.000Z');

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

const line = (overrides: Partial<SellableLineDraft> = {}) =>
  ({
    name: 'Gift code',
    description: 'Yearly',
    amount: 5000,
    quantity: 1,
    attach: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as SellableLineDraft;

const setup = () => {
  let itemCounter = 0;
  const tx = {
    invoice: {
      create: vi.fn().mockResolvedValue({ id: 'inv-1' }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        id: 'inv-1',
        items: [{ id: 'item-1' }],
      }),
    },
    invoiceItem: {
      create: vi.fn().mockImplementation(async ({ data }: any) => ({
        id: `item-${++itemCounter}`,
        ...data,
      })),
    },
  };
  const prisma = {
    $transaction: vi.fn().mockImplementation(async (fn: any) => fn(tx)),
  };
  const payments = {
    assertStandalonePaymentMethod: vi.fn().mockResolvedValue({}),
    createStandaloneInvoicePayment: vi
      .fn()
      .mockResolvedValue({ id: 'payment-1' }),
  };
  const service = new SellableCheckoutService(prisma as any, payments as any);

  return { service, prisma, tx, payments };
};

const input = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  mail: 'buyer@example.com',
  currency: Currency.CHF,
  description: 'Gift code purchase',
  kind: SellableKind.giftCode,
  lines: [line()],
  paymentMethodId: 'stripe-method',
  successURL: 'https://example.com/success',
  failureURL: 'https://example.com/fail',
  ...overrides,
});

describe('SellableCheckoutService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a subscription-less invoice for the buyer', async () => {
    const { service, tx } = setup();

    await service.checkout(input());

    expect(tx.invoice.create).toHaveBeenCalledWith({
      data: {
        userID: 'user-1',
        mail: 'buyer@example.com',
        currency: Currency.CHF,
        description: 'Gift code purchase',
        dueAt: NOW,
        scheduledDeactivationAt: addDays(NOW, 14),
        subscriptionID: null,
        sellableKind: SellableKind.giftCode,
      },
    });
  });

  it('cancels unpaid orders after the given number of days', async () => {
    const { service, tx } = setup();

    await service.checkout(input({ unpaidCancelAfterDays: 3 }));

    expect(tx.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scheduledDeactivationAt: addDays(NOW, 3),
      }),
    });
  });

  it('creates the items and attaches them inside the transaction', async () => {
    const { service, tx } = setup();
    const first = line();
    const second = line({ amount: 2000, quantity: 2, description: undefined });

    await service.checkout(input({ lines: [first, second] }));

    expect(tx.invoiceItem.create).toHaveBeenNthCalledWith(1, {
      data: {
        invoiceId: 'inv-1',
        name: 'Gift code',
        description: 'Yearly',
        amount: 5000,
        quantity: 1,
      },
    });
    expect(tx.invoiceItem.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ amount: 2000, quantity: 2 }),
    });
    expect(first.attach).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: 'item-1' })
    );
    expect(second.attach).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ id: 'item-2' })
    );
    expect(tx.invoice.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      include: { items: true },
    });
  });

  it('writes the discount code of a line onto its invoice item', async () => {
    const { service, tx } = setup();

    await service.checkout(
      input({ lines: [line({ amount: 4500, discountCodeId: 'dc-1' })] })
    );

    expect(tx.invoiceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 4500, discountCodeId: 'dc-1' }),
    });
  });

  it('starts the payment with the reloaded invoice after the commit', async () => {
    const { service, prisma, payments } = setup();

    const result = await service.checkout(input());

    expect(payments.createStandaloneInvoicePayment).toHaveBeenCalledWith({
      invoice: { id: 'inv-1', items: [{ id: 'item-1' }] },
      paymentMethodID: 'stripe-method',
      successURL: 'https://example.com/success',
      failureURL: 'https://example.com/fail',
    });
    expect(prisma.$transaction.mock.invocationCallOrder[0]).toBeLessThan(
      payments.createStandaloneInvoicePayment.mock.invocationCallOrder[0]
    );
    expect(result).toEqual({
      invoice: { id: 'inv-1', items: [{ id: 'item-1' }] },
      payment: { id: 'payment-1' },
    });
  });

  it('retries the whole transaction on a unique violation', async () => {
    const { service, prisma, payments } = setup();
    const attach = vi
      .fn()
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValue(undefined);

    await service.checkout(input({ lines: [line({ attach })] }));

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(payments.createStandaloneInvoicePayment).toHaveBeenCalledTimes(1);
  });

  it('gives up after five unique violations', async () => {
    const { service, prisma, payments } = setup();
    const attach = vi.fn().mockRejectedValue(uniqueViolation());

    await expect(
      service.checkout(input({ lines: [line({ attach })] }))
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(prisma.$transaction).toHaveBeenCalledTimes(5);
    expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
  });

  it('does not retry other errors', async () => {
    const { service, prisma } = setup();
    const attach = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(
      service.checkout(input({ lines: [line({ attach })] }))
    ).rejects.toThrow('boom');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no lines', { lines: [] }],
    ['a non-integer amount', { lines: [line({ amount: 10.5 })] }],
    ['a negative amount', { lines: [line({ amount: -100 })] }],
    ['a zero quantity', { lines: [line({ quantity: 0 })] }],
  ])('rejects %s', async (_, overrides) => {
    const { service, prisma } = setup();

    await expect(service.checkout(input(overrides))).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('hands a zero total to the payment service like any other total', async () => {
    const { service, prisma, payments } = setup();

    await expect(
      service.checkout(input({ lines: [line({ amount: 0 })] }))
    ).resolves.toEqual(
      expect.objectContaining({ payment: { id: 'payment-1' } })
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(payments.createStandaloneInvoicePayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodID: 'stripe-method' })
    );
  });

  it('rejects a payment method that cannot sell standalone invoices', async () => {
    const { service, prisma, payments } = setup();
    payments.assertStandalonePaymentMethod.mockRejectedValue(
      new BadRequestException('Payment method cannot be used for this purchase')
    );

    await expect(service.checkout(input())).rejects.toThrow(
      'Payment method cannot be used for this purchase'
    );
    expect(payments.assertStandalonePaymentMethod).toHaveBeenCalledWith(
      'stripe-method'
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
