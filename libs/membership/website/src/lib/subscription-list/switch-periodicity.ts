import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import {
  calculatePeriodAmount,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
} from '../formatters/format-payment-period';

/**
 * The monthly amount a subscription has after switching to another
 * periodicity: the reader's own, raised to the minimum of the new periodicity
 * when the plan prices it higher. Mirrors PeriodicitySwitchService in the api.
 */
export function switchedMonthlyAmount(
  {
    memberPlan,
    monthlyAmount,
  }: Pick<FullSubscriptionFragment, 'memberPlan' | 'monthlyAmount'>,
  periodicity: PaymentPeriodicity
): number {
  const { amountMin } = getPeriodPriceRange(memberPlan, periodicity);

  return calculatePeriodAmount(monthlyAmount, periodicity) < amountMin ?
      monthlyAmountFromPeriodAmount(amountMin, periodicity)
    : monthlyAmount;
}
