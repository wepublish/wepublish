import {
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionPeriod,
  Voucher,
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
import { PaymentsService } from '@wepublish/payment/api';
import { VoucherService } from '../voucher/voucher.service';
import { calculateAmountForPeriodicity } from '../legacy/member-context';

const roundUpTo5Cents = (amount: number) =>
  (Math.ceil((amount / 100) * 20) / 20) * 100;

const leftoverSubscriptionPeriodAmount = (periods: SubscriptionPeriod[]) => {
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

    return discount + roundUpTo5Cents(period.amount * leftoverPercentage);
  }, 0);

  return discountAmount;
};

@Injectable()
export class UpgradeSubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    private goodieService: GoodieService,
    private payments: PaymentsService,
    private voucherService: VoucherService
  ) {}

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
    voucher,
    goodieId,
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
    paymentMethodId: string;
    successURL?: string;
    failureURL?: string;
    monthlyAmount: number;
    voucher?: string;
    goodieId?: string;
  }) {
    const { oldSubscription, oldSubscriptionPeriods } =
      await this.validateForUpgrade({
        memberPlanId,
        subscriptionId,
        paymentMethodId,
        userId,
      });

    const leftoverDiscount =
      oldSubscriptionPeriods.length ?
        leftoverSubscriptionPeriodAmount(oldSubscriptionPeriods)
      : 0;

    let voucherId: string | undefined = undefined;
    let voucherDiscount = 0;

    if (voucher) {
      const voucherObj = await this.voucherService.getValidVoucher(
        voucher,
        memberPlanId
      );

      const amountAfterLeftoverDiscount = Math.max(
        calculateAmountForPeriodicity(
          monthlyAmount,
          oldSubscription.paymentPeriodicity
        ) - leftoverDiscount,
        0
      );

      voucherId = voucherObj.id;
      voucherDiscount =
        amountAfterLeftoverDiscount * (voucherObj.discountPercent / 100);
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
      discount: leftoverDiscount + voucherDiscount || undefined,
      voucherId,
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

  async getInfo({
    userId,
    subscriptionId,
    memberPlanId,
    voucher,
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
    voucher?: string;
  }) {
    const { oldSubscriptionPeriods } = await this.validateForUpgrade({
      memberPlanId,
      subscriptionId,
      paymentMethodId: null,
      userId,
    });

    const discountAmount =
      oldSubscriptionPeriods.length ?
        leftoverSubscriptionPeriodAmount(oldSubscriptionPeriods)
      : 0;

    if (!voucher) {
      return { discountAmount };
    }

    let validVoucher: Voucher | null = null;

    try {
      validVoucher = await this.voucherService.getValidVoucher(
        voucher,
        memberPlanId
      );
    } catch (e) {
      validVoucher = null;
    }

    return {
      discountAmount,
      voucherValid: !!validVoucher,
      discountPercent: validVoucher ? validVoucher.discountPercent / 100 : 0,
    };
  }
}
