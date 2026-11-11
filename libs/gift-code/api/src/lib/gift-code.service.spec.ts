import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Currency,
  GiftCodeCancellationReason,
  PaymentPeriodicity,
  PrismaClient,
  SellableKind,
} from '@prisma/client';
import {
  InvoicePaidNotifier,
  PaymentsService,
  SellableCheckoutService,
  SellableLineDraft,
} from '@wepublish/payment/api';
import { SortOrder } from '@wepublish/utils/api';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { GiftCodeService } from './gift-code.service';
import { GiftCodeStatus } from './gift-code-status';
import { GiftCodeSort, GiftCodeSource } from './gift-code.model';

const NOW = new Date('2026-10-24T12:00:00.000Z');
const buyer = { id: 'user-1', email: 'buyer@example.com' };

const memberPlan = {
  id: 'plan-1',
  name: 'Jahresabo',
  active: true,
  currency: Currency.CHF,
  periodicityPricing: [],
};

const offer = (overrides: Record<string, unknown> = {}) => ({
  id: 'offer-1',
  name: 'Jahresabo verschenken',
  active: true,
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
  redemptionWindowMonths: 12,
  issueBeforePayment: false,
  allowDiscountCodes: false,
  autoRenew: false,
  renewalPaymentMethodId: null,
  memberPlan,
  ...overrides,
});

const discountCode = (overrides: Record<string, unknown> = {}) => ({
  id: 'dc-1',
  code: 'sommer',
  memberPlanId: 'plan-1',
  discountPercent: 25,
  validFrom: new Date('2026-10-01T00:00:00.000Z'),
  validTo: new Date('2026-10-31T00:00:00.000Z'),
  ...overrides,
});

const purchaseInput = (overrides: Record<string, unknown> = {}) => ({
  offerId: 'offer-1',
  recipientName: '  Anna  ',
  paymentMethodId: 'pm-1',
  successURL: 'https://example.com/ok',
  failureURL: 'https://example.com/fail',
  ...overrides,
});

const openInvoice = {
  id: 'inv-1',
  subscriptionID: null,
  userID: 'user-1',
  paidAt: null,
  canceledAt: null,
  items: [{ id: 'item-1' }],
};

const ownedCode = (overrides: Record<string, unknown> = {}) => ({
  id: 'gc-1',
  offerId: 'offer-1',
  buyerId: 'user-1',
  issuedAt: null,
  expiresAt: null,
  redeemedAt: null,
  canceledAt: null,
  invoiceItem: { id: 'item-1', invoices: openInvoice },
  ...overrides,
});

const setup = () => {
  const tx = {
    giftCode: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ redemptionWindowMonths: 12 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    giftCodeOffer: {
      findUnique: vi.fn().mockResolvedValue(offer()),
    },
    paymentMethod: {
      findFirst: vi.fn().mockResolvedValue({ id: 'pm-1', slug: 'stripe' }),
    },
    giftCode: {
      findFirst: vi.fn().mockResolvedValue(ownedCode()),
      findUnique: vi.fn().mockResolvedValue({ id: 'gc-1', redeemedAt: null }),
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ id: 'gc-1', invoiceItem: { invoiceId: 'inv-1' } }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      createManyAndReturn: vi.fn(
        async ({ data }: { data: Record<string, unknown>[] }) =>
          data.map((row, index) => ({ id: `gc-${index}`, ...row }))
      ),
    },
    invoice: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    discountCode: {
      findUnique: vi.fn().mockResolvedValue(discountCode()),
    },
    $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
  };
  const offers = {
    getPrice: vi
      .fn()
      .mockReturnValue({ amount: 12000, currency: Currency.CHF }),
    getPaymentMethods: vi
      .fn()
      .mockResolvedValue([{ id: 'pm-1' }, { id: 'pm-2' }]),
    getPaymentMethodIds: vi.fn().mockResolvedValue(['pm-1', 'pm-3']),
  };
  const payment = { id: 'payment-1' };
  const payments = {
    createStandaloneInvoicePayment: vi.fn().mockResolvedValue(payment),
  };
  const checkout = {
    checkout: vi.fn().mockResolvedValue({ invoice: openInvoice, payment }),
  };
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };

  const service = new GiftCodeService(
    prisma as unknown as PrismaClient,
    offers as unknown as GiftCodeOfferService,
    payments as unknown as PaymentsService,
    checkout as unknown as SellableCheckoutService,
    notifier as unknown as InvoicePaidNotifier
  );

  return {
    service,
    prisma,
    tx,
    offers,
    payments,
    checkout,
    payment,
    notifier,
  };
};

const checkoutLine = (checkout: { checkout: ReturnType<typeof vi.fn> }) =>
  checkout.checkout.mock.calls[0][0].lines[0] as SellableLineDraft;

describe('GiftCodeService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('purchase', () => {
    it('checks out one gift code line at the offer price', async () => {
      const { service, checkout, payment, offers } = setup();

      await expect(service.purchase(buyer, purchaseInput())).resolves.toBe(
        payment
      );

      expect(offers.getPrice).toHaveBeenCalledWith(offer());
      expect(checkout.checkout).toHaveBeenCalledWith({
        userId: 'user-1',
        mail: 'buyer@example.com',
        currency: Currency.CHF,
        description: 'Jahresabo verschenken',
        paymentMethodId: 'pm-1',
        successURL: 'https://example.com/ok',
        failureURL: 'https://example.com/fail',
        kind: SellableKind.giftCode,
        lines: [
          {
            name: 'Jahresabo verschenken',
            description: 'Jahresabo (yearly)',
            amount: 12000,
            quantity: 1,
            attach: expect.any(Function),
          },
        ],
      });
    });

    it('creates an unissued code with the snapshot fields when attached', async () => {
      const { service, checkout, tx } = setup();

      await service.purchase(buyer, purchaseInput());
      await checkoutLine(checkout).attach(
        tx as never,
        { id: 'item-9' } as never
      );

      expect(tx.giftCode.create).toHaveBeenCalledWith({
        data: {
          code: expect.stringMatching(
            /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/
          ),
          offerId: 'offer-1',
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.yearly,
          redemptionWindowMonths: 12,
          invoiceItemId: 'item-9',
          buyerId: 'user-1',
          recipientName: 'Anna',
          autoRenew: false,
          renewalPaymentMethodId: null,
          issuedAt: null,
          expiresAt: null,
        },
      });
    });

    it('snapshots the renewal settings of the offer onto the code', async () => {
      const { service, checkout, tx, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
      );

      await service.purchase(buyer, purchaseInput());
      await checkoutLine(checkout).attach(
        tx as never,
        { id: 'item-9' } as never
      );

      expect(tx.giftCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          autoRenew: true,
          renewalPaymentMethodId: 'pm-renew',
        }),
      });
    });

    it('generates a new code on every attach so a retried checkout can succeed', async () => {
      const { service, checkout, tx } = setup();

      await service.purchase(buyer, purchaseInput());
      const line = checkoutLine(checkout);
      await line.attach(tx as never, { id: 'item-9' } as never);
      await line.attach(tx as never, { id: 'item-9' } as never);

      const [first, second] = tx.giftCode.create.mock.calls.map(
        ([{ data }]) => data.code
      );
      expect(first).not.toBe(second);
    });

    it('issues the code at purchase when the offer says so', async () => {
      const { service, checkout, tx, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ issueBeforePayment: true })
      );

      await service.purchase(buyer, purchaseInput());
      await checkoutLine(checkout).attach(
        tx as never,
        { id: 'item-9' } as never
      );

      expect(tx.giftCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          issuedAt: NOW,
          expiresAt: new Date('2027-10-24T12:00:00.000Z'),
        }),
      });
    });

    it('issues an early code without expiry for an unlimited window', async () => {
      const { service, checkout, tx, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ issueBeforePayment: true, redemptionWindowMonths: null })
      );

      await service.purchase(buyer, purchaseInput());
      await checkoutLine(checkout).attach(
        tx as never,
        { id: 'item-9' } as never
      );

      expect(tx.giftCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          redemptionWindowMonths: null,
          issuedAt: NOW,
          expiresAt: null,
        }),
      });
    });

    it('loads the offer with its member plan prices', async () => {
      const { service, prisma } = setup();

      await service.purchase(buyer, purchaseInput());

      expect(prisma.giftCodeOffer.findUnique).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        include: { memberPlan: { include: { periodicityPricing: true } } },
      });
    });

    it('resolves the payment method by its slug', async () => {
      const { service, prisma, checkout } = setup();

      await service.purchase(
        buyer,
        purchaseInput({
          paymentMethodId: undefined,
          paymentMethodSlug: 'stripe',
        })
      );

      expect(prisma.paymentMethod.findFirst).toHaveBeenCalledWith({
        where: { id: undefined, slug: 'stripe', active: true },
      });
      expect(checkout.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethodId: 'pm-1' })
      );
    });

    it.each([
      ['no selector', { paymentMethodId: undefined }],
      ['both selectors', { paymentMethodSlug: 'stripe' }],
    ])('rejects %s', async (_, overrides) => {
      const { service, checkout } = setup();

      await expect(
        service.purchase(buyer, purchaseInput(overrides))
      ).rejects.toThrow(
        'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
      );
      expect(checkout.checkout).not.toHaveBeenCalled();
    });

    it.each([
      ['a missing offer', null],
      ['an inactive offer', offer({ active: false })],
      [
        'an offer of an inactive plan',
        offer({ memberPlan: { ...memberPlan, active: false } }),
      ],
    ])('rejects %s', async (_, found) => {
      const { service, prisma, checkout } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(found);

      await expect(service.purchase(buyer, purchaseInput())).rejects.toThrow(
        'Gift code offer is not available'
      );
      expect(checkout.checkout).not.toHaveBeenCalled();
    });

    it('rejects a payment method that does not exist or is inactive', async () => {
      const { service, prisma, checkout } = setup();
      prisma.paymentMethod.findFirst.mockResolvedValue(null);

      await expect(service.purchase(buyer, purchaseInput())).rejects.toThrow(
        'Payment method cannot be used for this purchase'
      );
      expect(checkout.checkout).not.toHaveBeenCalled();
    });

    it('rejects a payment method that is not on the offer', async () => {
      const { service, offers, checkout } = setup();
      offers.getPaymentMethods.mockResolvedValue([{ id: 'pm-2' }]);

      await expect(service.purchase(buyer, purchaseInput())).rejects.toThrow(
        'Payment method cannot be used for this purchase'
      );
      expect(offers.getPaymentMethods).toHaveBeenCalledWith('offer-1');
      expect(checkout.checkout).not.toHaveBeenCalled();
    });

    it('rejects a zero price', async () => {
      const { service, offers, checkout } = setup();
      offers.getPrice.mockReturnValue({ amount: 0, currency: Currency.CHF });

      await expect(service.purchase(buyer, purchaseInput())).rejects.toThrow(
        BadRequestException
      );
      expect(checkout.checkout).not.toHaveBeenCalled();
    });

    describe('with a discount code', () => {
      const discountOffer = () => offer({ allowDiscountCodes: true });

      it.each([
        ['a missing', undefined],
        ['an empty', ''],
        ['a blank', '   '],
      ])('ignores %s code', async (_, code) => {
        const { service, prisma, checkout } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());

        await service.purchase(buyer, purchaseInput({ discountCode: code }));

        expect(prisma.discountCode.findUnique).not.toHaveBeenCalled();
        expect(checkoutLine(checkout).amount).toBe(12000);
        expect(checkoutLine(checkout).discountCodeId).toBeUndefined();
      });

      it('rejects a code when the offer does not allow discount codes', async () => {
        const { service, prisma, checkout } = setup();

        await expect(
          service.purchase(buyer, purchaseInput({ discountCode: 'SOMMER' }))
        ).rejects.toThrow(
          new BadRequestException(
            'Discount codes cannot be used for this gift.'
          )
        );
        expect(prisma.discountCode.findUnique).not.toHaveBeenCalled();
        expect(checkout.checkout).not.toHaveBeenCalled();
      });

      it('looks the code up in lower case for the member plan of the offer', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());

        await service.purchase(
          buyer,
          purchaseInput({ discountCode: ' SOMMER ' })
        );

        expect(prisma.discountCode.findUnique).toHaveBeenCalledWith({
          where: {
            code_memberPlanId: { code: 'sommer', memberPlanId: 'plan-1' },
          },
        });
      });

      it.each([
        ['an unknown code', null, 'DiscountCode is invalid.'],
        [
          'a code that is not valid yet',
          discountCode({ validFrom: new Date('2026-10-25T00:00:00.000Z') }),
          'DiscountCode is invalid.',
        ],
        [
          'an expired code',
          discountCode({ validTo: new Date('2026-10-24T11:00:00.000Z') }),
          'DiscountCode has expired.',
        ],
      ])('rejects %s', async (_, found, message) => {
        const { service, prisma, checkout } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());
        prisma.discountCode.findUnique.mockResolvedValue(found);

        await expect(
          service.purchase(buyer, purchaseInput({ discountCode: 'SOMMER' }))
        ).rejects.toThrow(new BadRequestException(message));
        expect(checkout.checkout).not.toHaveBeenCalled();
      });

      it('reduces the line amount and links the code to it', async () => {
        const { service, prisma, checkout } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());

        await service.purchase(
          buyer,
          purchaseInput({ discountCode: 'SOMMER' })
        );

        expect(checkoutLine(checkout)).toEqual(
          expect.objectContaining({ amount: 9000, discountCodeId: 'dc-1' })
        );
      });

      it('rounds the discount like the subscription checkout', async () => {
        const { service, prisma, offers, checkout } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());
        prisma.discountCode.findUnique.mockResolvedValue(
          discountCode({ discountPercent: 15 })
        );
        offers.getPrice.mockReturnValue({
          amount: 9990,
          currency: Currency.CHF,
        });

        await service.purchase(
          buyer,
          purchaseInput({ discountCode: 'SOMMER' })
        );

        expect(checkoutLine(checkout).amount).toBe(8491);
      });

      it('checks out a gift that a 100 % discount makes free', async () => {
        const { service, prisma, checkout } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(discountOffer());
        prisma.discountCode.findUnique.mockResolvedValue(
          discountCode({ discountPercent: 100 })
        );

        await service.purchase(
          buyer,
          purchaseInput({ discountCode: 'SOMMER' })
        );

        expect(checkoutLine(checkout)).toEqual(
          expect.objectContaining({ amount: 0, discountCodeId: 'dc-1' })
        );
      });
    });

    it.each([
      ['an empty recipient name', { recipientName: '   ' }],
      ['a too long recipient name', { recipientName: 'a'.repeat(201) }],
    ])('rejects %s', async (_, overrides) => {
      const { service, checkout } = setup();

      await expect(
        service.purchase(buyer, purchaseInput(overrides))
      ).rejects.toThrow(BadRequestException);
      expect(checkout.checkout).not.toHaveBeenCalled();
    });
  });

  describe('pay', () => {
    const payInput = (overrides: Record<string, unknown> = {}) => ({
      id: 'gc-1',
      paymentMethodId: 'pm-1',
      successURL: 'https://example.com/ok',
      failureURL: 'https://example.com/fail',
      ...overrides,
    });

    it('starts a payment for the open invoice of the buyer', async () => {
      const { service, prisma, payments, payment } = setup();

      await expect(service.pay('user-1', payInput())).resolves.toBe(payment);

      expect(prisma.giftCode.findFirst).toHaveBeenCalledWith({
        where: { id: 'gc-1', buyerId: 'user-1' },
        include: {
          invoiceItem: { include: { invoices: { include: { items: true } } } },
        },
      });
      expect(payments.createStandaloneInvoicePayment).toHaveBeenCalledWith({
        invoice: openInvoice,
        paymentMethodID: 'pm-1',
        successURL: 'https://example.com/ok',
        failureURL: 'https://example.com/fail',
      });
    });

    it('lets the buyer pay a code that was issued before payment', async () => {
      const { service, prisma, payments } = setup();
      prisma.giftCode.findFirst.mockResolvedValue(
        ownedCode({ issuedAt: NOW, expiresAt: null })
      );

      await service.pay('user-1', payInput());

      expect(payments.createStandaloneInvoicePayment).toHaveBeenCalled();
    });

    it('does not find the code of another buyer', async () => {
      const { service, prisma, payments } = setup();
      prisma.giftCode.findFirst.mockResolvedValue(null);

      await expect(service.pay('user-2', payInput())).rejects.toThrow(
        NotFoundException
      );
      expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
    });

    it.each([
      ['a canceled code', ownedCode({ canceledAt: NOW })],
      ['a redeemed code', ownedCode({ issuedAt: NOW, redeemedAt: NOW })],
      [
        'a paid invoice',
        ownedCode({
          invoiceItem: {
            id: 'item-1',
            invoices: { ...openInvoice, paidAt: NOW },
          },
        }),
      ],
      [
        'a canceled invoice',
        ownedCode({
          invoiceItem: {
            id: 'item-1',
            invoices: { ...openInvoice, canceledAt: NOW },
          },
        }),
      ],
      [
        'a line without invoice',
        ownedCode({ invoiceItem: { id: 'item-1', invoices: null } }),
      ],
      ['a code created by an admin', ownedCode({ invoiceItem: null })],
    ])('rejects %s', async (_, found) => {
      const { service, prisma, payments } = setup();
      prisma.giftCode.findFirst.mockResolvedValue(found);

      await expect(service.pay('user-1', payInput())).rejects.toThrow(
        'Gift code cannot be paid'
      );
      expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
    });

    it('rejects a payment method that is not on the offer', async () => {
      const { service, offers, payments } = setup();
      offers.getPaymentMethods.mockResolvedValue([{ id: 'pm-2' }]);

      await expect(service.pay('user-1', payInput())).rejects.toThrow(
        'Payment method cannot be used for this purchase'
      );
      expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
    });

    it('rejects a missing selector', async () => {
      const { service, payments } = setup();

      await expect(
        service.pay('user-1', payInput({ paymentMethodId: undefined }))
      ).rejects.toThrow(
        'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
      );
      expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
    });
  });

  describe('issueForInvoiceItem', () => {
    const paidAt = new Date('2026-10-20T08:00:00.000Z');

    it('issues the code with an expiry from the payment date', async () => {
      const { service, tx } = setup();

      await service.issueForInvoiceItem('item-1', paidAt);

      expect(tx.giftCode.findUnique).toHaveBeenCalledWith({
        where: { invoiceItemId: 'item-1' },
        select: { redemptionWindowMonths: true },
      });
      expect(tx.giftCode.updateMany).toHaveBeenCalledWith({
        where: { invoiceItemId: 'item-1', issuedAt: null, canceledAt: null },
        data: {
          issuedAt: paidAt,
          expiresAt: new Date('2027-10-20T08:00:00.000Z'),
        },
      });
    });

    it('issues a code without expiry for an unlimited window', async () => {
      const { service, tx } = setup();
      tx.giftCode.findUnique.mockResolvedValue({
        redemptionWindowMonths: null,
      });

      await service.issueForInvoiceItem('item-1', paidAt);

      expect(tx.giftCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { issuedAt: paidAt, expiresAt: null },
        })
      );
    });

    it('is a no-op for a code that was already issued or canceled', async () => {
      const { service, tx } = setup();
      tx.giftCode.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.issueForInvoiceItem('item-1', paidAt)
      ).resolves.toBeUndefined();
    });

    it('does nothing when the line has no code', async () => {
      const { service, tx } = setup();
      tx.giftCode.findUnique.mockResolvedValue(null);

      await expect(
        service.issueForInvoiceItem('item-1', paidAt)
      ).resolves.toBeUndefined();
      expect(tx.giftCode.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('cancelForInvoiceItem', () => {
    it.each([
      GiftCodeCancellationReason.chargeback,
      GiftCodeCancellationReason.invoiceCanceled,
    ])('cancels the code of the line with reason %s', async reason => {
      const { service, prisma } = setup();

      await service.cancelForInvoiceItem('item-1', reason);

      expect(prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { invoiceItemId: 'item-1', canceledAt: null },
        data: { canceledAt: NOW, cancellationReason: reason },
      });
    });

    it('also cancels a code that was issued before payment', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.findUnique.mockResolvedValue({
        id: 'gc-1',
        issuedAt: NOW,
        redeemedAt: null,
      });

      await service.cancelForInvoiceItem(
        'item-1',
        GiftCodeCancellationReason.invoiceCanceled
      );

      expect(prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { invoiceItemId: 'item-1', canceledAt: null },
        data: {
          canceledAt: NOW,
          cancellationReason: GiftCodeCancellationReason.invoiceCanceled,
        },
      });
    });
  });

  describe('cancel', () => {
    it('cancels the code manually and closes its unpaid invoice', async () => {
      const { service, prisma } = setup();

      await expect(service.cancel('gc-1', 'admin-1')).resolves.toEqual({
        id: 'gc-1',
        invoiceItem: { invoiceId: 'inv-1' },
      });

      expect(prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'gc-1', canceledAt: null, redeemedAt: null },
        data: {
          canceledAt: NOW,
          cancellationReason: GiftCodeCancellationReason.manual,
          canceledByUserId: 'admin-1',
        },
      });
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-1', paidAt: null, canceledAt: null },
        data: { canceledAt: NOW },
      });
    });

    it('reconciles the invoice right after closing it', async () => {
      const { service, prisma, notifier } = setup();

      await service.cancel('gc-1', 'admin-1');

      expect(notifier.notify).toHaveBeenCalledWith('inv-1');
      expect(
        prisma.invoice.updateMany.mock.invocationCallOrder[0]
      ).toBeLessThan(notifier.notify.mock.invocationCallOrder[0]);
    });

    it('also reconciles an invoice that was already settled', async () => {
      const { service, prisma, notifier } = setup();
      prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

      await service.cancel('gc-1', 'admin-1');

      expect(notifier.notify).toHaveBeenCalledWith('inv-1');
    });

    it('rejects a redeemed or already canceled code', async () => {
      const { service, prisma, notifier } = setup();
      prisma.giftCode.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancel('gc-1', 'admin-1')).rejects.toThrow(
        'Gift code cannot be canceled'
      );
      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
      expect(notifier.notify).not.toHaveBeenCalled();
    });

    it('cancels a code created by an admin without touching an invoice', async () => {
      const { service, prisma, notifier } = setup();
      prisma.giftCode.findUniqueOrThrow.mockResolvedValue({
        id: 'gc-1',
        invoiceItem: null,
      });

      await expect(service.cancel('gc-1', 'admin-1')).resolves.toEqual({
        id: 'gc-1',
        invoiceItem: null,
      });

      expect(prisma.giftCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'gc-1', canceledAt: null, redeemedAt: null },
        data: {
          canceledAt: NOW,
          cancellationReason: GiftCodeCancellationReason.manual,
          canceledByUserId: 'admin-1',
        },
      });
      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
      expect(notifier.notify).not.toHaveBeenCalled();
    });

    it('skips the invoice when the line has none', async () => {
      const { service, prisma, notifier } = setup();
      prisma.giftCode.findUniqueOrThrow.mockResolvedValue({
        id: 'gc-1',
        invoiceItem: { invoiceId: null },
      });

      await service.cancel('gc-1', 'admin-1');

      expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
      expect(notifier.notify).not.toHaveBeenCalled();
    });
  });

  describe('paymentMethodIdsForInvoiceItem', () => {
    it("returns the configured methods of the line's offer", async () => {
      const { service, prisma, offers } = setup();
      prisma.giftCode.findUnique.mockResolvedValue({ offerId: 'offer-1' });

      await expect(
        service.paymentMethodIdsForInvoiceItem('item-1')
      ).resolves.toEqual(['pm-1', 'pm-3']);
      expect(prisma.giftCode.findUnique).toHaveBeenCalledWith({
        where: { invoiceItemId: 'item-1' },
        select: { offerId: true },
      });
      expect(offers.getPaymentMethodIds).toHaveBeenCalledWith('offer-1');
    });

    it('allows no method for a line without a gift code', async () => {
      const { service, prisma, offers } = setup();
      prisma.giftCode.findUnique.mockResolvedValue(null);

      await expect(
        service.paymentMethodIdsForInvoiceItem('item-1')
      ).resolves.toEqual([]);
      expect(offers.getPaymentMethodIds).not.toHaveBeenCalled();
    });
  });

  describe('getGiftCodes', () => {
    it('combines the filters', async () => {
      const { service, prisma } = setup();
      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-12-31T00:00:00.000Z');

      await service.getGiftCodes(
        {
          filter: {
            status: GiftCodeStatus.canceled,
            offerId: 'offer-1',
            memberPlanId: 'plan-1',
            buyerId: 'user-1',
            createdFrom: from,
            createdTo: to,
          },
        },
        NOW
      );

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { canceledAt: { not: null } },
              { offerId: 'offer-1' },
              { memberPlanId: 'plan-1' },
              { buyerId: 'user-1' },
              { createdAt: { gte: from } },
              { createdAt: { lte: to } },
            ],
          },
        })
      );
    });

    it.each([
      [true, { invoiceItem: { invoices: { paidAt: { not: null } } } }],
      [false, { invoiceItem: { invoices: { paidAt: null } } }],
    ])('filters by paid = %s', async (paid, where) => {
      const { service, prisma } = setup();

      await service.getGiftCodes({ filter: { paid, offerId: 'offer-1' } }, NOW);

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ offerId: 'offer-1' }, where] },
        })
      );
      expect(prisma.giftCode.count).toHaveBeenCalledWith({
        where: { AND: [{ offerId: 'offer-1' }, where] },
      });
    });

    it.each([
      [GiftCodeSource.admin, { invoiceItemId: null }],
      [GiftCodeSource.purchase, { invoiceItemId: { not: null } }],
    ])('filters by source = %s', async (source, where) => {
      const { service, prisma } = setup();

      await service.getGiftCodes(
        { filter: { source, offerId: 'offer-1' } },
        NOW
      );

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ offerId: 'offer-1' }, where] },
        })
      );
      expect(prisma.giftCode.count).toHaveBeenCalledWith({
        where: { AND: [{ offerId: 'offer-1' }, where] },
      });
    });

    it('searches the exact code, the recipient and the buyer mail', async () => {
      const { service, prisma } = setup();

      await service.getGiftCodes({ filter: { search: 'abcd-efgh-jkmn' } }, NOW);

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { code: 'ABCDEFGHJKMN' },
                  {
                    recipientName: {
                      contains: 'abcd-efgh-jkmn',
                      mode: 'insensitive',
                    },
                  },
                  {
                    buyer: {
                      email: {
                        contains: 'abcd-efgh-jkmn',
                        mode: 'insensitive',
                      },
                    },
                  },
                ],
              },
            ],
          },
        })
      );
    });

    it('does not search by code when the term is no code', async () => {
      const { service, prisma } = setup();

      await service.getGiftCodes({ filter: { search: 'anna' } }, NOW);

      const where = prisma.giftCode.findMany.mock.calls[0][0].where;
      expect(where.AND[0].OR).toEqual([
        { recipientName: { contains: 'anna', mode: 'insensitive' } },
        { buyer: { email: { contains: 'anna', mode: 'insensitive' } } },
      ]);
    });

    it('paginates and sorts', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      prisma.giftCode.count.mockResolvedValue(7);

      const result = await service.getGiftCodes(
        {
          take: 1,
          skip: 3,
          sort: GiftCodeSort.IssuedAt,
          order: SortOrder.Ascending,
        },
        NOW
      );

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith({
        where: { AND: [] },
        skip: 3,
        take: 2,
        orderBy: { issuedAt: 'asc' },
        cursor: undefined,
      });
      expect(result).toEqual({
        nodes: [{ id: 'a' }],
        totalCount: 7,
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: true,
          startCursor: 'a',
          endCursor: 'a',
        },
      });
    });
  });

  describe('createByAdmin', () => {
    const createInput = (overrides: Record<string, unknown> = {}) => ({
      offerId: 'offer-1',
      count: 2,
      recipientName: '  Anna  ',
      ...overrides,
    });

    const createdRows = (
      prisma: ReturnType<typeof setup>['prisma'],
      call = 0
    ) =>
      prisma.giftCode.createManyAndReturn.mock.calls[call][0].data as Record<
        string,
        unknown
      >[];

    it('issues the codes right away from the offer snapshot', async () => {
      const { service, prisma } = setup();

      const created = await service.createByAdmin(createInput(), 'admin-1');

      expect(prisma.giftCodeOffer.findUnique).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
      });
      expect(created).toHaveLength(2);
      expect(createdRows(prisma)).toEqual([
        {
          code: expect.stringMatching(/^[A-Z2-9]{12}$/),
          offerId: 'offer-1',
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.yearly,
          redemptionWindowMonths: 12,
          recipientName: 'Anna',
          autoRenew: false,
          renewalPaymentMethodId: null,
          issuedAt: NOW,
          expiresAt: new Date('2027-10-24T12:00:00.000Z'),
          createdByUserId: 'admin-1',
        },
        expect.objectContaining({ createdByUserId: 'admin-1' }),
      ]);
    });

    it('snapshots the renewal settings of the offer onto every code', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
      );

      await service.createByAdmin(createInput(), 'admin-1');

      expect(createdRows(prisma)).toEqual([
        expect.objectContaining({
          autoRenew: true,
          renewalPaymentMethodId: 'pm-renew',
        }),
        expect.objectContaining({
          autoRenew: true,
          renewalPaymentMethodId: 'pm-renew',
        }),
      ]);
    });

    it('creates no invoice and no payment', async () => {
      const { service, checkout, payments, notifier } = setup();

      await service.createByAdmin(createInput(), 'admin-1');

      expect(checkout.checkout).not.toHaveBeenCalled();
      expect(payments.createStandaloneInvoicePayment).not.toHaveBeenCalled();
      expect(notifier.notify).not.toHaveBeenCalled();
    });

    it('creates distinct codes', async () => {
      const { service, prisma } = setup();

      await service.createByAdmin(createInput({ count: 50 }), 'admin-1');

      const codes = createdRows(prisma).map(({ code }) => code);
      expect(new Set(codes).size).toBe(50);
    });

    it.each([undefined, null, '', '   '])(
      'stores the recipient name %j as null',
      async recipientName => {
        const { service, prisma } = setup();

        await service.createByAdmin(createInput({ recipientName }), 'admin-1');

        expect(createdRows(prisma).map(row => row.recipientName)).toEqual([
          null,
          null,
        ]);
      }
    );

    it('creates codes without expiry for an unlimited window', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ redemptionWindowMonths: null })
      );

      await service.createByAdmin(createInput({ count: 1 }), 'admin-1');

      expect(createdRows(prisma)[0]).toEqual(
        expect.objectContaining({
          redemptionWindowMonths: null,
          issuedAt: NOW,
          expiresAt: null,
        })
      );
    });

    it('creates codes for an inactive offer', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(
        offer({ active: false })
      );

      await expect(
        service.createByAdmin(createInput({ count: 1 }), 'admin-1')
      ).resolves.toHaveLength(1);
    });

    it.each([0, -1, 501, 1.5])('rejects a count of %s', async count => {
      const { service, prisma } = setup();

      await expect(
        service.createByAdmin(createInput({ count }), 'admin-1')
      ).rejects.toThrow('You can create 1 to 500 gift codes at once');
      expect(prisma.giftCode.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('accepts 500 codes', async () => {
      const { service } = setup();

      await expect(
        service.createByAdmin(createInput({ count: 500 }), 'admin-1')
      ).resolves.toHaveLength(500);
    });

    it('rejects a recipient name that is too long', async () => {
      const { service, prisma } = setup();

      await expect(
        service.createByAdmin(
          createInput({ recipientName: 'a'.repeat(201) }),
          'admin-1'
        )
      ).rejects.toThrow(BadRequestException);
      expect(prisma.giftCode.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('throws for an unknown offer', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(null);

      await expect(
        service.createByAdmin(createInput(), 'admin-1')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.giftCode.createManyAndReturn).not.toHaveBeenCalled();
    });

    it('retries with new codes when a code is taken', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.createManyAndReturn.mockRejectedValueOnce({
        code: 'P2002',
      });

      await expect(
        service.createByAdmin(createInput({ count: 1 }), 'admin-1')
      ).resolves.toHaveLength(1);

      expect(prisma.giftCode.createManyAndReturn).toHaveBeenCalledTimes(2);
      expect(createdRows(prisma, 1)[0].code).not.toBe(
        createdRows(prisma, 0)[0].code
      );
    });

    it('gives up after five collisions', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.createManyAndReturn.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.createByAdmin(createInput({ count: 1 }), 'admin-1')
      ).rejects.toEqual({ code: 'P2002' });
      expect(prisma.giftCode.createManyAndReturn).toHaveBeenCalledTimes(5);
    });

    it('does not retry other errors', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.createManyAndReturn.mockRejectedValue(new Error('boom'));

      await expect(
        service.createByAdmin(createInput({ count: 1 }), 'admin-1')
      ).rejects.toThrow('boom');
      expect(prisma.giftCode.createManyAndReturn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMyGiftCodes', () => {
    it('lists the codes of the buyer, newest first', async () => {
      const { service, prisma } = setup();

      await service.getMyGiftCodes('user-1');

      expect(prisma.giftCode.findMany).toHaveBeenCalledWith({
        where: { buyerId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
