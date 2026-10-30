import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GiftCodeCancellationReason,
  Payment,
  Prisma,
  PrismaClient,
  SellableKind,
} from '@prisma/client';
import {
  InvoicePaidNotifier,
  PaymentsService,
  SellableCheckoutService,
} from '@wepublish/payment/api';
import { getMaxTake, logger, SortOrder } from '@wepublish/utils/api';
import { addMonths } from 'date-fns';
import { generateGiftCode, normalizeGiftCode } from './gift-code-generator';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { giftCodeStatusWhere } from './gift-code-status';
import {
  CreateGiftCodesInput,
  GIFT_CODE_ADMIN_MAX_COUNT,
  GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH,
  GiftCodeFilter,
  GiftCodeListArgs,
  GiftCodeSort,
  GiftCodeSource,
  PayGiftCodeInput,
  PurchaseGiftCodeInput,
} from './gift-code.model';

const PAYMENT_METHOD_REJECTED =
  'Payment method cannot be used for this purchase';

const MAX_CODE_ATTEMPTS = 5;

const isUniqueViolation = (error: unknown) =>
  (error as { code?: string } | null)?.code === 'P2002';

const generateDistinctGiftCodes = (count: number) => {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateGiftCode());
  }

  return [...codes];
};

type PaymentMethodSelector = {
  paymentMethodId?: string | null;
  paymentMethodSlug?: string | null;
};

const expiryFrom = (issuedAt: Date, redemptionWindowMonths: number | null) =>
  redemptionWindowMonths ? addMonths(issuedAt, redemptionWindowMonths) : null;

@Injectable()
export class GiftCodeService {
  constructor(
    private prisma: PrismaClient,
    private offers: GiftCodeOfferService,
    private payments: PaymentsService,
    private checkout: SellableCheckoutService,
    private invoicePaidNotifier: InvoicePaidNotifier
  ) {}

  async purchase(
    user: { id: string; email: string },
    input: PurchaseGiftCodeInput
  ): Promise<Payment> {
    assertSingleSelector(input);

    const recipientName = input.recipientName.trim();
    const discountCode = input.discountCode?.trim() || null;

    if (
      !recipientName ||
      recipientName.length > GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `The recipient name must have 1 to ${GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH} characters`
      );
    }

    const offer = await this.prisma.giftCodeOffer.findUnique({
      where: { id: input.offerId },
      include: { memberPlan: { include: { periodicityPricing: true } } },
    });

    if (!offer?.active || !offer.memberPlan.active) {
      throw new BadRequestException('Gift code offer is not available');
    }

    if (discountCode && !offer.allowDiscountCodes) {
      throw new BadRequestException(
        'Discount codes cannot be used for this gift.'
      );
    }

    const paymentMethodId = await this.resolveOfferPaymentMethod(
      offer.id,
      input
    );
    const { amount, currency } = this.offers.getPrice(offer);

    if (amount <= 0) {
      throw new BadRequestException('Gift code offer has no price');
    }

    const discount =
      discountCode ?
        await this.getValidDiscountCode(discountCode, offer.memberPlanId)
      : null;
    const lineAmount =
      discount ?
        amount - Math.round((amount * discount.discountPercent) / 100)
      : amount;

    const { payment } = await this.checkout.checkout({
      userId: user.id,
      mail: user.email,
      currency,
      description: offer.name,
      paymentMethodId,
      successURL: input.successURL,
      failureURL: input.failureURL,
      kind: SellableKind.giftCode,
      lines: [
        {
          name: offer.name,
          description: `${offer.memberPlan.name} (${offer.periodicity})`,
          amount: lineAmount,
          quantity: 1,
          discountCodeId: discount?.id,
          attach: async (tx, item) => {
            const issuedAt = offer.issueBeforePayment ? new Date() : null;

            await tx.giftCode.create({
              data: {
                code: generateGiftCode(),
                offerId: offer.id,
                memberPlanId: offer.memberPlanId,
                periodicity: offer.periodicity,
                redemptionWindowMonths: offer.redemptionWindowMonths,
                invoiceItemId: item.id,
                buyerId: user.id,
                recipientName,
                autoRenew: offer.autoRenew,
                renewalPaymentMethodId: offer.renewalPaymentMethodId,
                issuedAt,
                expiresAt:
                  issuedAt &&
                  expiryFrom(issuedAt, offer.redemptionWindowMonths),
              },
            });
          },
        },
      ],
    });

    return payment;
  }

  async pay(userId: string, input: PayGiftCodeInput): Promise<Payment> {
    assertSingleSelector(input);

    const giftCode = await this.prisma.giftCode.findFirst({
      where: { id: input.id, buyerId: userId },
      include: {
        invoiceItem: { include: { invoices: { include: { items: true } } } },
      },
    });

    if (!giftCode) {
      throw new NotFoundException(`Gift code ${input.id} was not found.`);
    }

    const invoice = giftCode.invoiceItem?.invoices;

    if (
      giftCode.canceledAt ||
      giftCode.redeemedAt ||
      !invoice ||
      invoice.paidAt ||
      invoice.canceledAt
    ) {
      throw new BadRequestException('Gift code cannot be paid');
    }

    const paymentMethodId = await this.resolveOfferPaymentMethod(
      giftCode.offerId,
      input
    );

    return this.payments.createStandaloneInvoicePayment({
      invoice,
      paymentMethodID: paymentMethodId,
      successURL: input.successURL,
      failureURL: input.failureURL,
    });
  }

  async issueForInvoiceItem(invoiceItemId: string, paidAt: Date) {
    await this.prisma.$transaction(async tx => {
      const giftCode = await tx.giftCode.findUnique({
        where: { invoiceItemId },
        select: { redemptionWindowMonths: true },
      });

      if (!giftCode) {
        logger('giftCodeService').warn(
          `No gift code found for invoice item ${invoiceItemId}`
        );
        return;
      }

      await tx.giftCode.updateMany({
        where: { invoiceItemId, issuedAt: null, canceledAt: null },
        data: {
          issuedAt: paidAt,
          expiresAt: expiryFrom(paidAt, giftCode.redemptionWindowMonths),
        },
      });
    });
  }

  async cancelForInvoiceItem(
    invoiceItemId: string,
    reason: GiftCodeCancellationReason
  ) {
    const giftCode = await this.prisma.giftCode.findUnique({
      where: { invoiceItemId },
      select: { id: true, redeemedAt: true },
    });

    if (giftCode?.redeemedAt) {
      logger('giftCodeService').warn(
        `Canceling gift code ${giftCode.id}, which was already redeemed`
      );
    }

    await this.prisma.giftCode.updateMany({
      where: { invoiceItemId, canceledAt: null },
      data: { canceledAt: new Date(), cancellationReason: reason },
    });
  }

  async cancel(id: string, adminUserId: string) {
    const now = new Date();
    const { count } = await this.prisma.giftCode.updateMany({
      where: { id, canceledAt: null, redeemedAt: null },
      data: {
        canceledAt: now,
        cancellationReason: GiftCodeCancellationReason.manual,
        canceledByUserId: adminUserId,
      },
    });

    if (!count) {
      throw new BadRequestException('Gift code cannot be canceled');
    }

    const giftCode = await this.prisma.giftCode.findUniqueOrThrow({
      where: { id },
      include: { invoiceItem: true },
    });

    const invoiceId = giftCode.invoiceItem?.invoiceId;

    if (invoiceId) {
      await this.prisma.invoice.updateMany({
        where: { id: invoiceId, paidAt: null, canceledAt: null },
        data: { canceledAt: now },
      });
      await this.invoicePaidNotifier.notify(invoiceId);
    }

    return giftCode;
  }

  async createByAdmin(
    { offerId, count, recipientName }: CreateGiftCodesInput,
    adminUserId: string
  ) {
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > GIFT_CODE_ADMIN_MAX_COUNT
    ) {
      throw new BadRequestException(
        `You can create 1 to ${GIFT_CODE_ADMIN_MAX_COUNT} gift codes at once`
      );
    }

    const name = recipientName?.trim() || null;

    if (name && name.length > GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH) {
      throw new BadRequestException(
        `The recipient name must have at most ${GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH} characters`
      );
    }

    const offer = await this.prisma.giftCodeOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException(`Gift code offer ${offerId} was not found.`);
    }

    const issuedAt = new Date();
    const expiresAt = expiryFrom(issuedAt, offer.redemptionWindowMonths);

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.giftCode.createManyAndReturn({
          data: generateDistinctGiftCodes(count).map(code => ({
            code,
            offerId: offer.id,
            memberPlanId: offer.memberPlanId,
            periodicity: offer.periodicity,
            redemptionWindowMonths: offer.redemptionWindowMonths,
            recipientName: name,
            autoRenew: offer.autoRenew,
            renewalPaymentMethodId: offer.renewalPaymentMethodId,
            issuedAt,
            expiresAt,
            createdByUserId: adminUserId,
          })),
        });
      } catch (error) {
        if (attempt >= MAX_CODE_ATTEMPTS || !isUniqueViolation(error)) {
          throw error;
        }
      }
    }
  }

  async paymentMethodIdsForInvoiceItem(
    invoiceItemId: string
  ): Promise<string[]> {
    const giftCode = await this.prisma.giftCode.findUnique({
      where: { invoiceItemId },
      select: { offerId: true },
    });

    if (!giftCode) {
      return [];
    }

    return this.offers.getPaymentMethodIds(giftCode.offerId);
  }

  async getGiftCodes(
    {
      filter,
      sort = GiftCodeSort.CreatedAt,
      order = SortOrder.Descending,
      cursorId,
      skip = 0,
      take = 10,
    }: GiftCodeListArgs,
    now = new Date()
  ) {
    const where = createGiftCodeFilter(filter, now);
    const direction = order === SortOrder.Ascending ? 'asc' : 'desc';
    const orderBy: Prisma.GiftCodeOrderByWithRelationInput =
      sort === GiftCodeSort.IssuedAt ?
        { issuedAt: direction }
      : { createdAt: direction };

    const [totalCount, giftCodes] = await Promise.all([
      this.prisma.giftCode.count({ where }),
      this.prisma.giftCode.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = giftCodes.slice(0, getMaxTake(take));

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: giftCodes.length > nodes.length,
        startCursor: nodes[0]?.id,
        endCursor: nodes[nodes.length - 1]?.id,
      },
    };
  }

  async getGiftCode(id: string) {
    return this.prisma.giftCode.findUnique({ where: { id } });
  }

  async getMyGiftCodes(userId: string) {
    return this.prisma.giftCode.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getValidDiscountCode(code: string, memberPlanId: string) {
    const discountCode = await this.prisma.discountCode.findUnique({
      where: {
        code_memberPlanId: { code: code.toLowerCase(), memberPlanId },
      },
    });
    const now = new Date();

    if (!discountCode || discountCode.validFrom > now) {
      throw new BadRequestException('DiscountCode is invalid.');
    }

    if (now > discountCode.validTo) {
      throw new BadRequestException('DiscountCode has expired.');
    }

    return discountCode;
  }

  private async resolveOfferPaymentMethod(
    offerId: string,
    { paymentMethodId, paymentMethodSlug }: PaymentMethodSelector
  ): Promise<string> {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId ? paymentMethodId : undefined,
        slug: paymentMethodId ? undefined : (paymentMethodSlug ?? undefined),
        active: true,
      },
    });

    if (!paymentMethod) {
      throw new BadRequestException(PAYMENT_METHOD_REJECTED);
    }

    const offered = await this.offers.getPaymentMethods(offerId);

    if (!offered.some(({ id }) => id === paymentMethod.id)) {
      throw new BadRequestException(PAYMENT_METHOD_REJECTED);
    }

    return paymentMethod.id;
  }
}

function assertSingleSelector({
  paymentMethodId,
  paymentMethodSlug,
}: PaymentMethodSelector) {
  if ((paymentMethodId == null) === (paymentMethodSlug == null)) {
    throw new BadRequestException(
      'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
    );
  }
}

const createSearchFilter = (search: string): Prisma.GiftCodeWhereInput => {
  const code = normalizeGiftCode(search);

  return {
    OR: [
      ...(code ? [{ code }] : []),
      { recipientName: { contains: search, mode: 'insensitive' } },
      { buyer: { email: { contains: search, mode: 'insensitive' } } },
    ],
  };
};

const createPaidFilter = (paid: boolean): Prisma.GiftCodeWhereInput => ({
  invoiceItem: { invoices: { paidAt: paid ? { not: null } : null } },
});

const createSourceFilter = (
  source: GiftCodeSource
): Prisma.GiftCodeWhereInput => ({
  invoiceItemId: source === GiftCodeSource.admin ? null : { not: null },
});

const createGiftCodeFilter = (
  filter: Partial<GiftCodeFilter> | undefined,
  now: Date
): Prisma.GiftCodeWhereInput => ({
  AND: [
    filter?.status ? giftCodeStatusWhere(filter.status, now) : null,
    filter?.offerId ? { offerId: filter.offerId } : null,
    filter?.memberPlanId ? { memberPlanId: filter.memberPlanId } : null,
    filter?.buyerId ? { buyerId: filter.buyerId } : null,
    filter?.paid != null ? createPaidFilter(filter.paid) : null,
    filter?.source ? createSourceFilter(filter.source) : null,
    filter?.createdFrom ? { createdAt: { gte: filter.createdFrom } } : null,
    filter?.createdTo ? { createdAt: { lte: filter.createdTo } } : null,
    filter?.search ? createSearchFilter(filter.search) : null,
  ].filter((where): where is Prisma.GiftCodeWhereInput => Boolean(where)),
});
