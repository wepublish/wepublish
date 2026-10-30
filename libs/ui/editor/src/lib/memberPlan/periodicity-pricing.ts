import { PaymentPeriodicity } from '@wepublish/editor/api';

import {
  ALL_PAYMENT_PERIODICITIES,
  getMonthlyEquivalentRange,
  PAYMENT_PERIODICITY_MONTHS,
  PeriodicityPriceRow,
} from '../utility';

export type PlanForPeriodAmount = {
  defaultPaymentPeriodicity?: PaymentPeriodicity | null;
  periodicityPricing?: PeriodicityPriceRow[] | null;
  availablePaymentMethods?: Array<{
    paymentPeriodicities: PaymentPeriodicity[];
  }> | null;
};

export const getPlanPeriodicities = (
  plan: PlanForPeriodAmount
): PaymentPeriodicity[] =>
  ALL_PAYMENT_PERIODICITIES.filter(periodicity =>
    plan.availablePaymentMethods?.some(paymentMethod =>
      paymentMethod.paymentPeriodicities.includes(periodicity)
    )
  );

export const calculatePeriodAmount = (
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
) => Math.round(monthlyAmount * PAYMENT_PERIODICITY_MONTHS[periodicity]);

export const getPeriodPriceRange = (
  plan: PlanForPeriodAmount,
  periodicity: PaymentPeriodicity
) => {
  const row = plan.periodicityPricing?.find(
    price => price.periodicity === periodicity
  );
  const equivalent = getMonthlyEquivalentRange(plan.periodicityPricing);

  const derive = (amount: number | null | undefined) =>
    amount != null ? calculatePeriodAmount(amount, periodicity) : null;

  return {
    amountMin: row?.amountMin ?? derive(equivalent.amountPerMonthMin) ?? 0,
    amountTarget: row?.amountTarget ?? derive(equivalent.amountPerMonthTarget),
    amountMax: row?.amountMax ?? derive(equivalent.amountPerMonthMax),
  };
};
