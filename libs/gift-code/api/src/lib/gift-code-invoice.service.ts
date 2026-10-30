import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';
import { logger } from '@wepublish/utils/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import { normalizeGiftCode } from './gift-code-generator';
import { PayInvoiceWithGiftCodeInput } from './gift-code.model';

export const GIFT_CODE_REJECTED = 'This gift code cannot pay this invoice.';

const INVOICE_REJECTED = 'This invoice cannot be paid with a gift code.';

const isUniqueViolation = (error: unknown) =>
  (error as { code?: string } | null)?.code === 'P2002';

type Claim = {
  redeemedAt: Date;
  redeemedByUserId: string;
  redeemedSubscriptionId: string;
  redeemedInvoiceId: string;
};

@Injectable()
export class GiftCodeInvoiceService {
  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService,
    private attempts: GiftCodeAttemptLimiter
  ) {}

  async payInvoice(
    userId: string,
    { invoiceId, code: input }: PayInvoiceWithGiftCodeInput
  ) {
    await this.attempts.reserve(userId);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: true },
    });
    const subscription = invoice?.subscription;

    if (
      !invoice ||
      !subscription ||
      subscription.userID !== userId ||
      invoice.sellableKind ||
      invoice.paidAt ||
      invoice.canceledAt
    ) {
      throw new BadRequestException(INVOICE_REJECTED);
    }

    const code = normalizeGiftCode(input);

    if (!code) {
      throw new BadRequestException(GIFT_CODE_REJECTED);
    }

    await this.payments.assertSubscriptionInvoiceSettleable(invoice.id);

    const now = new Date();

    await this.claim(
      {
        code,
        memberPlanId: subscription.memberPlanID,
        periodicity: subscription.paymentPeriodicity,
        issuedAt: { not: null },
        canceledAt: null,
        redeemedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      {
        redeemedAt: now,
        redeemedByUserId: userId,
        redeemedSubscriptionId: subscription.id,
        redeemedInvoiceId: invoice.id,
      }
    );

    try {
      await this.payments.settleSubscriptionInvoiceWithoutCharge(invoice.id);
    } catch (error) {
      const paid = await this.releaseClaimUnlessPaid(invoice.id, now);

      if (!paid) {
        throw error;
      }
    }

    await this.attempts.forget(userId);

    return this.prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true },
    });
  }

  private async claim(where: Prisma.GiftCodeWhereInput, data: Claim) {
    let count: number;

    try {
      ({ count } = await this.prisma.giftCode.updateMany({ where, data }));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new BadRequestException(INVOICE_REJECTED);
      }

      throw error;
    }

    if (count !== 1) {
      throw new BadRequestException(GIFT_CODE_REJECTED);
    }
  }

  private async releaseClaimUnlessPaid(invoiceId: string, claimedAt: Date) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.paidAt) {
      logger('giftCodeInvoiceService').error(
        `Invoice ${invoiceId} was paid with a gift code, but settling it failed afterwards`
      );
      return true;
    }

    await this.prisma.giftCode.updateMany({
      where: { redeemedInvoiceId: invoiceId, redeemedAt: claimedAt },
      data: {
        redeemedAt: null,
        redeemedByUserId: null,
        redeemedSubscriptionId: null,
        redeemedInvoiceId: null,
      },
    });

    return false;
  }
}
