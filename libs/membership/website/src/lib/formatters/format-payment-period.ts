import { PaymentPeriodicity } from '@wepublish/website/api';
import { cond } from 'ramda';

export const formatFirstPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'Erster Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'Ersten 3 Monate'],
  [period => period === PaymentPeriodicity.Biannual, () => 'Ersten 6 Monate'],
  [period => period === PaymentPeriodicity.Biennial, () => 'Ersten 2 Jahre'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'Erstes Jahr'],
]);

export const formatAfterFirstPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'dem ersten Monat'],
  [
    period => period === PaymentPeriodicity.Quarterly,
    () => 'den ersten 3 Monaten',
  ],
  [
    period => period === PaymentPeriodicity.Biannual,
    () => 'den ersten 6 Monaten',
  ],
  [
    period => period === PaymentPeriodicity.Biennial,
    () => 'den ersten 2 Jahren',
  ],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'dem ersten Jahr'],
]);

export const formatPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => '1 Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => '3 Monate'],
  [period => period === PaymentPeriodicity.Biannual, () => '6 Monate'],
  [period => period === PaymentPeriodicity.Biennial, () => '2 Jahre'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => '1 Jahr'],
]);

export const formatPaymentTimeline = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'monatlich'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'vierteljährlich'],
  [period => period === PaymentPeriodicity.Biannual, () => 'halbjährlich'],
  [period => period === PaymentPeriodicity.Biennial, () => 'zweijährlich'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'jährlich'],
]);

export const getPaymentPeriodicyMonths = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 1],
  [period => period === PaymentPeriodicity.Quarterly, () => 3],
  [period => period === PaymentPeriodicity.Biannual, () => 6],
  [period => period === PaymentPeriodicity.Biennial, () => 24],
  [period => period === PaymentPeriodicity.Lifetime, () => 1200],
  [(period: PaymentPeriodicity) => true, () => 12],
]);

export const calculatePeriodAmount = (
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
): number => Math.round(monthlyAmount * getPaymentPeriodicyMonths(periodicity));

export const monthlyAmountFromPeriodAmount = (
  periodAmount: number,
  periodicity: PaymentPeriodicity
): number => periodAmount / getPaymentPeriodicyMonths(periodicity);

export const PERIODICITY_ORDER = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
] as const;

export const formatPeriodUnit = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'Quartal'],
  [period => period === PaymentPeriodicity.Biannual, () => 'Halbjahr'],
  [period => period === PaymentPeriodicity.Biennial, () => '2 Jahre'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'Jahr'],
]);

export type PeriodicityPrice = {
  periodicity: PaymentPeriodicity;
  label?: string | null;
  amountMin?: number | null;
  amountTarget?: number | null;
  amountMax?: number | null;
};

type MemberPlanPeriodicityPricing = {
  periodicityPricing?: PeriodicityPrice[] | null;
};

type MemberPlanWithPaymentMethods = MemberPlanPeriodicityPricing & {
  availablePaymentMethods?: Array<{
    paymentPeriodicities: PaymentPeriodicity[];
  }> | null;
  defaultPaymentPeriodicity?: PaymentPeriodicity | null;
};

export const getPlanPeriodicities = (
  memberPlan: MemberPlanWithPaymentMethods | null | undefined
): PaymentPeriodicity[] =>
  PERIODICITY_ORDER.filter(periodicity =>
    memberPlan?.availablePaymentMethods?.some(availablePaymentMethod =>
      availablePaymentMethod.paymentPeriodicities.includes(periodicity)
    )
  );

export const getDefaultPeriodicity = (
  memberPlan: MemberPlanWithPaymentMethods | null | undefined
): PaymentPeriodicity | undefined => {
  const periodicities = getPlanPeriodicities(memberPlan);

  if (
    memberPlan?.defaultPaymentPeriodicity &&
    periodicities.includes(memberPlan.defaultPaymentPeriodicity)
  ) {
    return memberPlan.defaultPaymentPeriodicity;
  }

  return periodicities[0];
};

export const getPeriodicityLabel = (
  memberPlan: MemberPlanPeriodicityPricing | null | undefined,
  periodicity: PaymentPeriodicity
): string | null | undefined =>
  memberPlan?.periodicityPricing?.find(
    price => price.periodicity === periodicity
  )?.label;

export const getCheapestOffer = (
  memberPlan: MemberPlanWithPaymentMethods
): {
  periodicity: PaymentPeriodicity;
  amountMin: number;
  amountTarget: number | null;
  amountMax: number | null;
} => {
  const periodicities = getPlanPeriodicities(memberPlan);

  if (!periodicities.length) {
    return {
      periodicity: PaymentPeriodicity.Monthly,
      ...getPeriodPriceRange(memberPlan, PaymentPeriodicity.Monthly),
    };
  }

  return periodicities
    .map(periodicity => ({
      periodicity,
      ...getPeriodPriceRange(memberPlan, periodicity),
    }))
    .reduce((cheapest, offer) =>
      (
        monthlyAmountFromPeriodAmount(offer.amountMin, offer.periodicity) <
        monthlyAmountFromPeriodAmount(cheapest.amountMin, cheapest.periodicity)
      ) ?
        offer
      : cheapest
    );
};

const getBasePriceRow = (
  rows: PeriodicityPrice[]
): PeriodicityPrice | undefined => {
  const monthly = rows.find(
    row => row.periodicity === PaymentPeriodicity.Monthly
  );

  if (monthly?.amountMin != null) {
    return monthly;
  }

  const priced = rows.filter(row => row.amountMin != null);
  const nonLifetime = priced.filter(
    row => row.periodicity !== PaymentPeriodicity.Lifetime
  );
  const candidates = nonLifetime.length ? nonLifetime : priced;

  return candidates.reduce<PeriodicityPrice | undefined>((cheapest, row) => {
    if (!cheapest) {
      return row;
    }

    const perMonth = (candidate: PeriodicityPrice) =>
      candidate.amountMin! / getPaymentPeriodicyMonths(candidate.periodicity);

    return perMonth(row) < perMonth(cheapest) ? row : cheapest;
  }, undefined);
};

export const getPeriodPriceRange = (
  memberPlan: MemberPlanPeriodicityPricing,
  periodicity: PaymentPeriodicity
): {
  amountMin: number;
  amountTarget: number | null;
  amountMax: number | null;
} => {
  const rows = memberPlan.periodicityPricing ?? [];
  const row = rows.find(price => price.periodicity === periodicity);
  const base = getBasePriceRow(rows);

  const derive = (amount: number | null | undefined) =>
    amount == null || !base ?
      null
    : calculatePeriodAmount(
        monthlyAmountFromPeriodAmount(amount, base.periodicity),
        periodicity
      );

  return {
    amountMin: row?.amountMin ?? derive(base?.amountMin) ?? 0,
    amountTarget: row?.amountTarget ?? derive(base?.amountTarget),
    amountMax: row?.amountMax ?? derive(base?.amountMax),
  };
};

export const getMonthlyEquivalentRange = (
  memberPlan: MemberPlanPeriodicityPricing
): {
  amountPerMonthMin: number;
  amountPerMonthTarget: number | null;
  amountPerMonthMax: number | null;
  periodicity: PaymentPeriodicity;
} => {
  const rows = memberPlan.periodicityPricing ?? [];
  const base = getBasePriceRow(rows);

  if (!base) {
    return {
      amountPerMonthMin: 0,
      amountPerMonthTarget: null,
      amountPerMonthMax: null,
      periodicity: PaymentPeriodicity.Monthly,
    };
  }

  const perMonth = (amount: number | null | undefined) =>
    amount != null ?
      monthlyAmountFromPeriodAmount(amount, base.periodicity)
    : null;

  return {
    amountPerMonthMin: perMonth(base.amountMin) ?? 0,
    amountPerMonthTarget: perMonth(base.amountTarget),
    amountPerMonthMax: perMonth(base.amountMax),
    periodicity: base.periodicity,
  };
};
