import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AvailablePaymentMethod,
  GiftCode,
  MemberPlan,
  PaymentPeriodicity,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionDeactivation,
  SubscriptionEvent,
  SubscriptionPeriod,
} from '@prisma/client';
import { MemberContextService } from '@wepublish/membership/api';
import {
  isPaymentMethodRetired,
  PaymentsService,
} from '@wepublish/payment/api';
import { logger, monthlyAmountFromPeriodAmount } from '@wepublish/utils/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import { normalizeGiftCode } from './gift-code-generator';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { GiftCodeRedemptionAction } from './gift-code-redemption.model';

export const GIFT_CODE_REJECTED = 'This gift code cannot be redeemed.';

const rejected = () => new BadRequestException(GIFT_CODE_REJECTED);

const isConstraintViolation = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;

  return code === 'P2002' || code === 'P2003';
};

const redeemable = (now: Date): Prisma.GiftCodeWhereInput => ({
  issuedAt: { not: null },
  canceledAt: null,
  redeemedAt: null,
  OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
});

type InvoiceState = {
  id: string;
  paidAt: Date | null;
  canceledAt: Date | null;
};

type FittingSubscription = Subscription & {
  periods: SubscriptionPeriod[];
  deactivation: SubscriptionDeactivation | null;
  invoices: InvoiceState[];
};

type Target = {
  action: GiftCodeRedemptionAction;
  subscriptionId: string;
  invoiceId: string;
};

const createsInvoice = ({ action }: Target) =>
  action !== GiftCodeRedemptionAction.paidInvoice;

const createsSubscription = ({ action }: Target) =>
  action === GiftCodeRedemptionAction.createdSubscription;

const hasOpenInvoice = ({ invoices }: FittingSubscription) =>
  invoices.some(({ paidAt, canceledAt }) => !paidAt && !canceledAt);

const paidUntilTime = ({ paidUntil }: FittingSubscription) =>
  paidUntil?.getTime() ?? Number.NEGATIVE_INFINITY;

const isBetterFit = (
  candidate: FittingSubscription,
  current: FittingSubscription
) => {
  if (hasOpenInvoice(candidate) !== hasOpenInvoice(current)) {
    return hasOpenInvoice(candidate);
  }

  return paidUntilTime(candidate) > paidUntilTime(current);
};

const pickSubscription = (subscriptions: FittingSubscription[]) =>
  subscriptions.reduce<FittingSubscription | undefined>(
    (best, candidate) =>
      !best || isBetterFit(candidate, best) ? candidate : best,
    undefined
  );

const offeredPaymentMethodIds = (
  {
    availablePaymentMethods,
  }: { availablePaymentMethods: AvailablePaymentMethod[] },
  { periodicity, autoRenew }: Pick<GiftCode, 'periodicity' | 'autoRenew'>
) => [
  ...new Set(
    availablePaymentMethods
      .filter(
        row =>
          row.paymentPeriodicities.includes(periodicity) &&
          (autoRenew || !row.forceAutoRenewal)
      )
      .flatMap(row => row.paymentMethodIDs)
  ),
];

@Injectable()
export class GiftCodeRedemptionService {
  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService,
    private memberContext: MemberContextService,
    private offers: GiftCodeOfferService,
    private attempts: GiftCodeAttemptLimiter
  ) {}

  async redeem(userId: string, input: string) {
    await this.attempts.reserve(userId);

    const code = normalizeGiftCode(input);

    if (!code) {
      throw rejected();
    }

    const now = new Date();
    const giftCode = await this.prisma.giftCode.findFirst({
      where: { code, ...redeemable(now) },
    });

    if (!giftCode) {
      throw rejected();
    }

    const target = await this.prepare(userId, giftCode);

    try {
      await this.claim(giftCode.id, now, userId, target);
    } catch (error) {
      await this.discard(target);
      throw error;
    }

    try {
      await this.payments.settleSubscriptionInvoiceWithoutCharge(
        target.invoiceId
      );
    } catch (error) {
      const paid = await this.releaseClaimUnlessPaid(giftCode.id, target, now);

      if (!paid) {
        await this.discard(target);
        throw error;
      }
    }

    await this.attempts.forget(userId);

    const [subscription, invoice] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { id: target.subscriptionId },
      }),
      this.prisma.invoice.findUnique({
        where: { id: target.invoiceId },
        include: { items: true },
      }),
    ]);

    if (createsSubscription(target) && subscription) {
      await this.sendSubscribeMail(subscription);
    }

    return { action: target.action, subscription, invoice };
  }

  private async prepare(userId: string, giftCode: GiftCode): Promise<Target> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userID: userId,
        memberPlanID: giftCode.memberPlanId,
        paymentPeriodicity: giftCode.periodicity,
        extendable: true,
        deactivation: null,
      },
      include: {
        periods: true,
        deactivation: true,
        invoices: { select: { id: true, paidAt: true, canceledAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const subscription = pickSubscription(subscriptions);

    return subscription ?
        this.prepareRenewal(subscription)
      : this.prepareNewSubscription(userId, giftCode);
  }

  private async prepareRenewal(
    subscription: FittingSubscription
  ): Promise<Target> {
    if (subscription.paymentPeriodicity === PaymentPeriodicity.lifetime) {
      throw rejected();
    }

    await this.refuseOnBadRequest(
      this.payments.assertPaymentMethodSettleableWithoutCharge(
        subscription.paymentMethodID
      )
    );

    const knownInvoiceIds = new Set(subscription.invoices.map(({ id }) => id));
    const invoice = await this.memberContext.renewSubscriptionForUser({
      subscription,
    });

    if (!invoice) {
      throw rejected();
    }

    if (!knownInvoiceIds.has(invoice.id)) {
      const target = {
        action: GiftCodeRedemptionAction.extendedSubscription,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
      };

      if (await this.overlapsAnotherPeriod(target)) {
        await this.discard(target);
        throw rejected();
      }

      return target;
    }

    await this.refuseOnBadRequest(
      this.payments.assertSubscriptionInvoiceSettleable(invoice.id)
    );

    return {
      action: GiftCodeRedemptionAction.paidInvoice,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
    };
  }

  private async overlapsAnotherPeriod({ subscriptionId, invoiceId }: Target) {
    const period = await this.prisma.subscriptionPeriod.findFirst({
      where: { invoiceID: invoiceId },
    });

    if (!period) {
      return true;
    }

    const overlapping = await this.prisma.subscriptionPeriod.count({
      where: {
        subscriptionId,
        invoiceID: { not: invoiceId },
        startsAt: { lte: period.endsAt },
        endsAt: { gte: period.startsAt },
        invoice: { canceledAt: null },
      },
    });

    return overlapping > 0;
  }

  private async prepareNewSubscription(
    userId: string,
    giftCode: GiftCode
  ): Promise<Target> {
    const memberPlan = await this.prisma.memberPlan.findUnique({
      where: { id: giftCode.memberPlanId },
      include: { periodicityPricing: true, availablePaymentMethods: true },
    });

    if (!memberPlan?.active || (giftCode.autoRenew && !memberPlan.extendable)) {
      throw rejected();
    }

    await this.assertBelowMaxCount(userId, memberPlan);

    const { amount } = this.offers.getPrice({
      periodicity: giftCode.periodicity,
      memberPlan,
    });

    if (amount <= 0) {
      throw rejected();
    }

    const paymentMethodId = await this.newSubscriptionPaymentMethod(
      memberPlan,
      giftCode
    );

    if (!paymentMethodId) {
      throw rejected();
    }

    try {
      const { subscription, invoice } =
        await this.memberContext.createSubscription({
          userID: userId,
          memberPlanID: memberPlan.id,
          paymentPeriodicity: giftCode.periodicity,
          paymentMethodID: paymentMethodId,
          monthlyAmount: monthlyAmountFromPeriodAmount(
            amount,
            giftCode.periodicity
          ),
          autoRenew: giftCode.autoRenew,
          extendable: memberPlan.extendable,
          properties: [],
          skipMail: true,
        });

      return {
        action: GiftCodeRedemptionAction.createdSubscription,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
      };
    } catch (error) {
      logger('giftCodeRedemptionService').error(
        error as Error,
        'Could not create a subscription for a gift code of member plan %s',
        memberPlan.id
      );
      throw rejected();
    }
  }

  private async assertBelowMaxCount(
    userId: string,
    memberPlan: Pick<MemberPlan, 'id' | 'maxCount'>
  ) {
    if (!memberPlan.maxCount) {
      return;
    }

    const count = await this.prisma.subscription.count({
      where: { userID: userId, memberPlanID: memberPlan.id },
    });

    if (count >= memberPlan.maxCount) {
      throw rejected();
    }
  }

  private async newSubscriptionPaymentMethod(
    memberPlan: { availablePaymentMethods: AvailablePaymentMethod[] },
    giftCode: GiftCode
  ) {
    const offered = offeredPaymentMethodIds(memberPlan, giftCode);
    const candidates =
      !giftCode.autoRenew ? offered
      : (
        giftCode.renewalPaymentMethodId &&
        offered.includes(giftCode.renewalPaymentMethodId)
      ) ?
        [giftCode.renewalPaymentMethodId]
      : [];

    for (const id of candidates) {
      if (await this.isUsablePaymentMethod(id)) {
        return id;
      }
    }

    return null;
  }

  private async isUsablePaymentMethod(id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (
      !paymentMethod?.active ||
      (await isPaymentMethodRetired(this.prisma, paymentMethod))
    ) {
      return false;
    }

    try {
      await this.payments.assertPaymentMethodSettleableWithoutCharge(id);
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        return false;
      }

      throw error;
    }
  }

  private async refuseOnBadRequest(check: Promise<void>) {
    try {
      await check;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw rejected();
      }

      throw error;
    }
  }

  private async claim(
    giftCodeId: string,
    now: Date,
    userId: string,
    { subscriptionId, invoiceId }: Target
  ) {
    let count: number;

    try {
      ({ count } = await this.prisma.giftCode.updateMany({
        where: { id: giftCodeId, ...redeemable(now) },
        data: {
          redeemedAt: now,
          redeemedByUserId: userId,
          redeemedSubscriptionId: subscriptionId,
          redeemedInvoiceId: invoiceId,
        },
      }));
    } catch (error) {
      if (isConstraintViolation(error)) {
        throw rejected();
      }

      throw error;
    }

    if (count !== 1) {
      throw rejected();
    }
  }

  private async releaseClaimUnlessPaid(
    giftCodeId: string,
    { invoiceId }: Target,
    claimedAt: Date
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.paidAt) {
      logger('giftCodeRedemptionService').error(
        `Invoice ${invoiceId} was paid with a gift code, but settling it failed afterwards`
      );
      return true;
    }

    await this.prisma.giftCode.updateMany({
      where: {
        id: giftCodeId,
        redeemedInvoiceId: invoiceId,
        redeemedAt: claimedAt,
      },
      data: {
        redeemedAt: null,
        redeemedByUserId: null,
        redeemedSubscriptionId: null,
        redeemedInvoiceId: null,
      },
    });

    return false;
  }

  private async discard(target: Target) {
    if (!createsInvoice(target)) {
      return;
    }

    const { subscriptionId, invoiceId } = target;

    try {
      const [claims, invoice] = await Promise.all([
        this.prisma.giftCode.count({
          where: {
            OR: [
              { redeemedInvoiceId: invoiceId },
              ...(createsSubscription(target) ?
                [{ redeemedSubscriptionId: subscriptionId }]
              : []),
            ],
          },
        }),
        this.prisma.invoice.findUnique({ where: { id: invoiceId } }),
      ]);

      if (claims || !invoice || invoice.paidAt) {
        return;
      }

      await this.prisma.$transaction([
        this.prisma.payment.deleteMany({ where: { invoiceID: invoiceId } }),
        this.prisma.subscriptionPeriod.deleteMany({
          where: { invoiceID: invoiceId },
        }),
        this.prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
        this.prisma.invoice.deleteMany({ where: { id: invoiceId } }),
        ...(createsSubscription(target) ?
          [
            this.prisma.subscription.deleteMany({
              where: { id: subscriptionId },
            }),
          ]
        : []),
      ]);
    } catch (error) {
      logger('giftCodeRedemptionService').error(
        error as Error,
        'Could not remove invoice %s after a failed gift code redemption',
        invoiceId
      );
    }
  }

  private async sendSubscribeMail(subscription: Subscription) {
    try {
      await this.memberContext.sendMailForSubscriptionEvent(
        SubscriptionEvent.SUBSCRIBE,
        subscription,
        {}
      );
    } catch (error) {
      logger('giftCodeRedemptionService').error(
        error as Error,
        'Could not send the subscribe mail for subscription %s',
        subscription.id
      );
    }
  }
}
