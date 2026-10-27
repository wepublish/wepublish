import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
} from '@wepublish/website/api';

import { getMonthlyEquivalentRange } from '../formatters/format-payment-period';

/**
 * Whether the upgrade flow can offer this subscription anything: the plans it
 * lists (extendable, more expensive per month, see `Upgrade`) narrowed to those
 * the server accepts (same billing period), and only while the subscription is
 * running without a cancellation, a payment method change or an unpaid upgrade.
 */
export function canUpgrade(
  subscription: Pick<
    FullSubscriptionFragment,
    | 'isActive'
    | 'deactivation'
    | 'pendingPaymentMethodChange'
    | 'canRevertUpgrade'
    | 'memberPlan'
    | 'paymentPeriodicity'
  >,
  memberPlans: FullMemberPlanFragment[]
): boolean {
  if (
    !subscription.isActive ||
    subscription.deactivation ||
    subscription.pendingPaymentMethodChange ||
    subscription.canRevertUpgrade
  ) {
    return false;
  }

  const currentMonthlyMin = getMonthlyEquivalentRange(
    subscription.memberPlan
  ).amountPerMonthMin;

  return memberPlans.some(
    plan =>
      plan.extendable &&
      plan.id !== subscription.memberPlan.id &&
      getMonthlyEquivalentRange(plan).amountPerMonthMin > currentMonthlyMin &&
      plan.availablePaymentMethods.some(({ paymentPeriodicities }) =>
        paymentPeriodicities.includes(subscription.paymentPeriodicity)
      )
  );
}
