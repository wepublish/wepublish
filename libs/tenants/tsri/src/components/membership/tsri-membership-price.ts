import {
  formatCurrency,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
} from '@wepublish/membership/website';
import {
  Currency,
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';

export const formatMembershipPrice = (
  cents: number,
  currency: Currency,
  locale: string
) => formatCurrency(cents / 100, currency, locale).replace(/\.-$/, '');

export const getMembershipPrice = (
  memberPlan: Pick<FullMemberPlanFragment, 'periodicityPricing'>,
  periodicity: PaymentPeriodicity
) => {
  const { amountMin, amountTarget } = getPeriodPriceRange(
    memberPlan,
    periodicity
  );
  const periodAmount = amountTarget ?? amountMin;

  return {
    periodAmount,
    monthlyAmount: monthlyAmountFromPeriodAmount(periodAmount, periodicity),
  };
};
