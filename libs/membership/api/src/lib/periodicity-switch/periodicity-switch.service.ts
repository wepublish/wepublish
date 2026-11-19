import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethodChangeState,
  PaymentPeriodicity,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';
import {
  calculatePeriodAmount,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
} from '@wepublish/utils/api';
import { MemberContextService } from '../legacy/member-context.service';

const switchContext = {
  deactivation: true,
  paymentMethod: true,
  memberPlan: {
    include: { availablePaymentMethods: true, periodicityPricing: true },
  },
  paymentMethodChanges: {
    where: { state: PaymentMethodChangeState.pending },
    take: 1,
  },
} satisfies Prisma.SubscriptionInclude;

type SubscriptionWithSwitchContext = Prisma.SubscriptionGetPayload<{
  include: typeof switchContext;
}>;

/**
 * Lets a reader change how often their subscription is billed, e.g. from
 * monthly to yearly. The running period stays as it is: the new periodicity
 * is billed from the next renewal on, and every switch is recorded.
 */
@Injectable()
export class PeriodicitySwitchService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    private payments: PaymentsService
  ) {}

  async switchablePeriodicities(
    subscriptionId: string
  ): Promise<PaymentPeriodicity[]> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: switchContext,
    });

    return subscription ? this.periodicitiesFor(subscription) : [];
  }

  async switchPeriodicity({
    userId,
    subscriptionId,
    paymentPeriodicity,
  }: {
    userId: string;
    subscriptionId: string;
    paymentPeriodicity: PaymentPeriodicity;
  }) {
    // scoped to the reader, otherwise anybody could switch a foreign subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId, userID: userId },
      include: switchContext,
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} was not found.`
      );
    }

    if (!this.periodicitiesFor(subscription).includes(paymentPeriodicity)) {
      throw new BadRequestException(
        `Subscription ${subscriptionId} can not be switched to ${paymentPeriodicity}.`
      );
    }

    const monthlyAmount = this.monthlyAmountFor(
      subscription,
      paymentPeriodicity
    );

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        paymentPeriodicity,
        monthlyAmount,
        periodicityChanges: {
          create: {
            fromPeriodicity: subscription.paymentPeriodicity,
            toPeriodicity: paymentPeriodicity,
            fromMonthlyAmount: subscription.monthlyAmount,
            toMonthlyAmount: monthlyAmount,
          },
        },
      },
      include: { deactivation: true, periods: true },
    });

    // replaces an invoice already created for the next period
    return this.memberContext.handleSubscriptionChange({
      subscription: updated,
    });
  }

  /**
   * The reader's amount, raised to the minimum of the new periodicity when a
   * plan prices it higher.
   */
  private monthlyAmountFor(
    { monthlyAmount, memberPlan }: SubscriptionWithSwitchContext,
    periodicity: PaymentPeriodicity
  ) {
    const { amountMin } = getPeriodPriceRange(memberPlan, periodicity);

    return calculatePeriodAmount(monthlyAmount, periodicity) < amountMin ?
        monthlyAmountFromPeriodAmount(amountMin, periodicity)
      : monthlyAmount;
  }

  /**
   * Only a running, paid subscription that renews can be switched, with its
   * payment method kept: the plan has to offer the new periodicity for it.
   */
  private periodicitiesFor(
    subscription: SubscriptionWithSwitchContext
  ): PaymentPeriodicity[] {
    const {
      extendable,
      deactivation,
      paidUntil,
      paymentMethodChanges,
      paymentMethod,
      paymentMethodID,
      autoRenew,
      memberPlan,
    } = subscription;

    const provider = this.payments
      .getProviders()
      .find(({ id }) => id === paymentMethod.paymentProviderID);

    if (
      !extendable ||
      deactivation ||
      !paidUntil ||
      paidUntil <= new Date() ||
      paymentMethodChanges.length ||
      // the provider bills on its own schedule, see updateRemoteSubscription
      provider?.remoteManagedSubscription
    ) {
      return [];
    }

    const offered = memberPlan.availablePaymentMethods
      .filter(
        ({ paymentMethodIDs, forceAutoRenewal }) =>
          paymentMethodIDs.includes(paymentMethodID) &&
          (!forceAutoRenewal || autoRenew)
      )
      .flatMap(({ paymentPeriodicities }) => paymentPeriodicities);

    return Object.values(PaymentPeriodicity).filter(
      periodicity =>
        periodicity !== subscription.paymentPeriodicity &&
        offered.includes(periodicity)
    );
  }
}
