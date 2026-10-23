import {
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionPeriod,
  DiscountCode,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { differenceInDays, endOfDay, startOfDay } from 'date-fns';
import { MemberContextService } from '../legacy/member-context.service';
import { GoodieService } from '../goodie/goodie.service';
import {
  isPaymentMethodRetired,
  PaymentsService,
} from '@wepublish/payment/api';
import { DiscountCodeService } from '../discountCode/discountCode.service';
import {
  calculateAmountForPeriodicity,
  getNextDateForPeriodicity,
} from '../legacy/member-context';
import { SettingName, SettingsService } from '@wepublish/settings/api';

const roundUpTo5Cents = (amount: number) =>
  (Math.ceil((amount / 100) * 20) / 20) * 100;

// TEMPORARY (remove once reflekt's imported subscription periods are sanitized):
// the reflekt v3 import stored the MONTHLY amount in period.amount instead of the
// period total. Correct only that exact fingerprint (amount === monthlyAmount) so
// the upgrade credit reflects what the member actually paid; genuine discounted or
// custom period amounts (amount !== monthlyAmount) are left untouched.
const effectivePeriodAmount = (
  period: SubscriptionPeriod,
  monthlyAmount: number
) =>
  period.amount === monthlyAmount ?
    calculateAmountForPeriodicity(monthlyAmount, period.paymentPeriodicity)
  : period.amount;

const leftoverSubscriptionPeriodAmount = (
  periods: SubscriptionPeriod[],
  monthlyAmount: number
) => {
  const today = startOfDay(new Date());

  const discountAmount = periods.reduce((discount, period) => {
    const start = startOfDay(period.startsAt);
    const end = endOfDay(period.endsAt);

    const totalDurationInDays = Math.min(
      differenceInDays(end, start),
      365 // don't give discounts for leap years
    );
    const leftoverDays = differenceInDays(end, today);
    const leftoverPercentage = leftoverDays / totalDurationInDays;

    return (
      discount +
      roundUpTo5Cents(
        effectivePeriodAmount(period, monthlyAmount) * leftoverPercentage
      )
    );
  }, 0);

  return discountAmount;
};

const fullSubscriptionPeriodAmount = (
  periods: SubscriptionPeriod[],
  monthlyAmount: number
) =>
  periods.reduce(
    (total, period) => total + effectivePeriodAmount(period, monthlyAmount),
    0
  );

@Injectable()
export class UpgradeSubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    private goodieService: GoodieService,
    private payments: PaymentsService,
    private discountCodeservice: DiscountCodeService,
    private settingsService: SettingsService
  ) {}

  private async resolvePeriodCreditCalculator() {
    try {
      const setting = await this.settingsService.settingByName(
        SettingName.SUBSCRIPTION_UPGRADE_BILLS_FULL_DIFFERENCE
      );

      if (setting?.value === true) {
        return fullSubscriptionPeriodAmount;
      }
    } catch {
      return leftoverSubscriptionPeriodAmount;
    }

    return leftoverSubscriptionPeriodAmount;
  }

  private async validateForUpgrade({
    memberPlanId,
    subscriptionId,
    paymentMethodId,
    userId,
  }: {
    userId: string;
    subscriptionId: string;
    paymentMethodId: string | null;
    memberPlanId: string;
  }) {
    const oldSubscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        memberPlan: {
          include: {
            availablePaymentMethods: true,
          },
        },
        periods: {
          include: {
            invoice: true,
          },
        },
      },
    });

    const newMemberplan = await this.prisma.memberPlan.findUnique({
      where: {
        id: memberPlanId,
      },
      include: {
        availablePaymentMethods: true,
      },
    });

    if (!oldSubscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} was not found.`
      );
    }

    if (oldSubscription.userID !== userId) {
      throw new ForbiddenException(
        `Subscription with id ${subscriptionId} does not belong to current user.`
      );
    }

    if (!newMemberplan) {
      throw new NotFoundException(
        `MemberPlan with id ${memberPlanId} was not found.`
      );
    }

    if (oldSubscription.memberPlanID === memberPlanId) {
      throw new BadRequestException(
        `Subscription is already of memberplan ${memberPlanId}`
      );
    }

    if (oldSubscription.currency !== newMemberplan.currency) {
      throw new BadRequestException(
        `New memberplan with id ${memberPlanId} does not support the same currency as memberplan with id ${oldSubscription.memberPlanID}`
      );
    }

    if (paymentMethodId) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (
        paymentMethod &&
        (await isPaymentMethodRetired(this.prisma, paymentMethod))
      ) {
        throw new BadRequestException(
          `PaymentMethod ${paymentMethodId} is no longer offered`
        );
      }
    }

    const paymentMethods =
      paymentMethodId ?
        newMemberplan.availablePaymentMethods.filter(av =>
          av.paymentMethodIDs.includes(paymentMethodId)
        )
      : newMemberplan.availablePaymentMethods;
    const hasPeriodicity = paymentMethods.some(av => {
      return av.paymentPeriodicities.includes(
        oldSubscription.paymentPeriodicity
      );
    });

    if (!hasPeriodicity) {
      throw new BadRequestException(
        `New memberplan with id ${memberPlanId} does not support the same payment periodicity as memberplan with id ${oldSubscription.memberPlanID}`
      );
    }

    const oldSubscriptionPeriods = oldSubscription.periods.filter(period => {
      if (!period.invoice.paidAt || new Date() > period.endsAt) {
        return false;
      }

      return true;
    });

    if (!oldSubscriptionPeriods.length) {
      throw new BadRequestException(
        `Subscription has no subscription period ${subscriptionId}`
      );
    }

    return { newMemberplan, oldSubscription, oldSubscriptionPeriods };
  }

  async upgradeSubscription({
    userId,
    subscriptionId,
    memberPlanId,
    paymentMethodId,
    successURL,
    failureURL,
    monthlyAmount,
    discountCode,
    goodieId,
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
    paymentMethodId: string;
    successURL?: string;
    failureURL?: string;
    monthlyAmount: number;
    discountCode?: string;
    goodieId?: string;
  }) {
    const { oldSubscription, oldSubscriptionPeriods } =
      await this.validateForUpgrade({
        memberPlanId,
        subscriptionId,
        paymentMethodId,
        userId,
      });

    const calculatePeriodCredit = await this.resolvePeriodCreditCalculator();
    const leftoverDiscount =
      oldSubscriptionPeriods.length ?
        calculatePeriodCredit(
          oldSubscriptionPeriods,
          oldSubscription.monthlyAmount
        )
      : 0;

    let discountCodeId: string | undefined = undefined;
    let discountCodeDiscount = 0;

    if (discountCode) {
      const discountCodeObj =
        await this.discountCodeservice.getValidDiscountCode(
          discountCode,
          memberPlanId
        );

      const amountAfterLeftoverDiscount = Math.max(
        calculateAmountForPeriodicity(
          monthlyAmount,
          oldSubscription.paymentPeriodicity
        ) - leftoverDiscount,
        0
      );

      discountCodeId = discountCodeObj.id;
      discountCodeDiscount =
        amountAfterLeftoverDiscount * (discountCodeObj.discountPercent / 100);
    }

    if (goodieId) {
      await this.goodieService.getValidGoodie(goodieId, memberPlanId);
    }

    const { invoice } = await this.memberContext.createSubscription({
      userID: userId,
      paymentMethodID: paymentMethodId,
      paymentPeriodicity: oldSubscription.paymentPeriodicity,
      monthlyAmount,
      memberPlanID: memberPlanId,
      properties: [],
      autoRenew: true,
      extendable: oldSubscription.extendable,
      replacedSubscriptionId: oldSubscription.id,
      startsAt: new Date(),
      discount: leftoverDiscount + discountCodeDiscount || undefined,
      discountCodeId,
      goodieId,
    });

    await Promise.all([
      this.memberContext.cancelInvoicesForSubscription(oldSubscription.id),
      this.memberContext.cancelRemoteSubscription({
        subscriptionId: oldSubscription.id,
        reason: SubscriptionDeactivationReason.userReplacedSubscription,
      }),
    ]);

    await this.prisma.subscription.update({
      where: {
        id: oldSubscription.id,
      },
      data: {
        paidUntil: new Date(),
        deactivation: {
          create: {
            date: new Date(),
            reason: SubscriptionDeactivationReason.userReplacedSubscription,
          },
        },
        periods: {
          updateMany: {
            where: {
              id: {
                in: oldSubscriptionPeriods.map(({ id }) => id),
              },
            },
            data: {
              endsAt: new Date(),
            },
          },
        },
      },
    });

    return await this.payments.createPaymentWithProvider({
      invoice,
      saveCustomer: true,
      paymentMethodID: paymentMethodId,
      successURL,
      failureURL,
      userId,
    });
  }

  async revertUpgrade({
    subscriptionId,
    userId,
  }: {
    subscriptionId: string;
    /**
     * The user the revert is done for, or null to revert as an admin, which
     * skips the ownership check. Required so that a caller can not drop the
     * check by forgetting the argument.
     */
    userId: string | null;
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        deactivation: true,
        periods: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} was not found.`
      );
    }

    if (userId && subscription.userID !== userId) {
      throw new ForbiddenException(
        `Subscription with id ${subscriptionId} does not belong to current user.`
      );
    }

    const replacements = await this.prisma.subscription.findMany({
      where: { replacesSubscriptionID: subscriptionId },
      include: { invoices: true },
    });

    if (!replacements.length) {
      throw new BadRequestException(
        `Subscription with id ${subscriptionId} was not upgraded.`
      );
    }

    if (
      replacements.some(replacement =>
        replacement.invoices.some(invoice => invoice.paidAt)
      )
    ) {
      throw new BadRequestException(
        `The upgrade of subscription with id ${subscriptionId} has already been paid.`
      );
    }

    for (const replacement of replacements) {
      const invoices = await this.prisma.invoice.findMany({
        where: { subscriptionID: replacement.id },
        select: { id: true },
      });
      const invoiceIds = invoices.map(({ id }) => id);

      // nothing of the upgrade has been paid, so the invoice and everything
      // hanging off it goes away with the subscription instead of being
      // detached into orphaned rows
      await this.prisma.payment.deleteMany({
        where: { invoiceID: { in: invoiceIds } },
      });

      await this.prisma.subscriptionPeriod.deleteMany({
        where: { invoiceID: { in: invoiceIds } },
      });

      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      await this.prisma.invoice.deleteMany({
        where: { id: { in: invoiceIds } },
      });

      await this.prisma.subscription.delete({
        where: { id: replacement.id },
      });
    }

    // the upgrade cut the running periods short, give them their original end back
    const truncatedAt = subscription.deactivation?.date;
    const restoredPeriods = subscription.periods.map(period => ({
      period,
      endsAt:
        truncatedAt && period.endsAt.getTime() === truncatedAt.getTime() ?
          getNextDateForPeriodicity(period.startsAt, period.paymentPeriodicity)
        : period.endsAt,
    }));

    for (const { period, endsAt } of restoredPeriods) {
      if (endsAt.getTime() === period.endsAt.getTime()) {
        continue;
      }

      await this.prisma.subscriptionPeriod.update({
        where: { id: period.id },
        data: { endsAt },
      });
    }

    if (subscription.deactivation) {
      await this.prisma.subscriptionDeactivation.delete({
        where: { subscriptionID: subscriptionId },
      });
    }

    const paidUntil = restoredPeriods.reduce<Date | null>(
      (latest, { endsAt }) => (!latest || endsAt > latest ? endsAt : latest),
      null
    );

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        paidUntil: paidUntil ?? subscription.paidUntil,
      },
      include: {
        deactivation: true,
        periods: true,
      },
    });
  }

  async getInfo({
    userId,
    subscriptionId,
    memberPlanId,
    discountCode,
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
    discountCode?: string;
  }) {
    const { oldSubscription, oldSubscriptionPeriods } =
      await this.validateForUpgrade({
        memberPlanId,
        subscriptionId,
        paymentMethodId: null,
        userId,
      });

    const calculatePeriodCredit = await this.resolvePeriodCreditCalculator();
    const discountAmount =
      oldSubscriptionPeriods.length ?
        calculatePeriodCredit(
          oldSubscriptionPeriods,
          oldSubscription.monthlyAmount
        )
      : 0;

    if (!discountCode) {
      return { discountAmount };
    }

    let validDiscountCode: DiscountCode | null = null;

    try {
      validDiscountCode = await this.discountCodeservice.getValidDiscountCode(
        discountCode,
        memberPlanId
      );
    } catch (e) {
      validDiscountCode = null;
    }

    return {
      discountAmount,
      discountCodeValid: !!validDiscountCode,
      discountPercent:
        validDiscountCode ? validDiscountCode.discountPercent / 100 : 0,
    };
  }
}
