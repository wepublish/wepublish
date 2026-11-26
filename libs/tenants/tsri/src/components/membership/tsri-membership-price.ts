import {
  formatCurrency,
  getDefaultPeriodicity,
  getPeriodPriceRange,
  getPlanPeriodicities,
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
) => formatCurrency(cents / 100, currency, locale).replace(/\.(-|00)$/, '');

type MemberPlanPeriodicities = Pick<
  FullMemberPlanFragment,
  'periodicityPricing'
> &
  Partial<
    Pick<
      FullMemberPlanFragment,
      'availablePaymentMethods' | 'defaultPaymentPeriodicity'
    >
  >;

export const getMembershipPeriodicity = (
  memberPlan: MemberPlanPeriodicities,
  periodicity?: PaymentPeriodicity
) =>
  periodicity && getPlanPeriodicities(memberPlan).includes(periodicity) ?
    periodicity
  : (getDefaultPeriodicity(memberPlan) ?? PaymentPeriodicity.Monthly);

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
