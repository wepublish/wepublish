import {
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionPeriod,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { differenceInDays, endOfDay, startOfDay } from 'date-fns';
import { descend, sort } from 'ramda';
import { MemberContextService } from '../legacy/member-context.service';
import { PaymentsService } from '@wepublish/payment/api';

const roundUpTo5Cents = (amount: number) =>
  (Math.ceil((amount / 100) * 20) / 20) * 100;

const leftoverSubscriptionPeriodAmount = (period: SubscriptionPeriod) => {
  const today = startOfDay(new Date());
  const start = startOfDay(period.startsAt);
  const end = endOfDay(period.endsAt);

  const totalDurationInDays = Math.min(
    differenceInDays(end, start),
    365 // don't give discounts for leap years
  );
  const leftoverDays = differenceInDays(end, today);
  const leftoverPercentage = leftoverDays / totalDurationInDays;

  const discountAmount = roundUpTo5Cents(period.amount * leftoverPercentage);

  return discountAmount;
};

@Injectable()
export class UpgradeSubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    private payments: PaymentsService
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

    const hasCompatibleRenewability = paymentMethods.some(av => {
      if (
        av.forceAutoRenewal &&
        (!oldSubscription.extendable || !oldSubscription.autoRenew)
      ) {
        return false;
      }

      return true;
    });

    if (!hasPeriodicity) {
      throw new BadRequestException(
        `New memberplan with id ${memberPlanId} does not support the same payment periodicity as memberplan with id ${oldSubscription.memberPlanID}`
      );
    }

    if (!hasCompatibleRenewability) {
      throw new BadRequestException(
        `New memberplan with id ${memberPlanId} does not support non extending subscriptiosn but the subscription with id ${subscriptionId} does not renew.`
      );
    }

    // In case a user has extended the subscription before running out
    // We ignore the period before the extension that might still be running.
    const oldSubscriptionPeriods = sort(
      descend(period => period.endsAt),
      oldSubscription.periods
    );

    const oldSubscriptionPeriod =
      oldSubscriptionPeriods.filter(period => !!period.invoice.paidAt).at(0) ??
      oldSubscriptionPeriods.at(0);

    if (!oldSubscriptionPeriod) {
      throw new BadRequestException(
        `Subscription has no subscription period ${subscriptionId}`
      );
    }

    return { newMemberplan, oldSubscription, oldSubscriptionPeriod };
  }

  async upgradeSubscription({
    userId,
    subscriptionId,
    memberPlanId,
    paymentMethodId,
    successURL,
    failureURL,
    monthlyAmount,
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
    paymentMethodId: string;
    successURL?: string;
    failureURL?: string;
    monthlyAmount: number;
  }) {
    const { oldSubscription, oldSubscriptionPeriod } =
      await this.validateForUpgrade({
        memberPlanId,
        subscriptionId,
        paymentMethodId,
        userId,
      });

    const { invoice } = await this.memberContext.createSubscription({
      userID: userId,
      paymentMethodId,
      paymentPeriodicity: oldSubscription.paymentPeriodicity,
      monthlyAmount,
      memberPlanId,
      properties: [],
      autoRenew: oldSubscription.autoRenew,
      extendable: oldSubscription.extendable,
      replacedSubscriptionId: oldSubscription.id,
      startsAt: new Date(),
      discount:
        oldSubscriptionPeriod.invoice.paidAt ?
          leftoverSubscriptionPeriodAmount(oldSubscriptionPeriod)
        : undefined,
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
          update: {
            where: {
              id: oldSubscriptionPeriod.id,
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
  }: {
    userId: string;
    subscriptionId: string;
    memberPlanId: string;
  }) {
    const { oldSubscriptionPeriod } = await this.validateForUpgrade({
      memberPlanId,
      subscriptionId,
      paymentMethodId: null,
      userId,
    });

    return oldSubscriptionPeriod.invoice.paidAt ?
        leftoverSubscriptionPeriodAmount(oldSubscriptionPeriod)
      : 0;
  }
}
