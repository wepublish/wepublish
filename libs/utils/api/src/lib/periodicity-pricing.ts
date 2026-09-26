import { PaymentPeriodicity } from '@prisma/client';
import { z } from 'zod';
import { mapPaymentPeriodToMonths } from './payment-period-to-months';

/**
 * The exact amount (integer cents) charged for one full payment period.
 * `monthlyAmount` may be fractional (e.g. 500.00 / year -> 4166.6666... cents
 * per month); rounding here guarantees the period total is exact.
 */
export function calculatePeriodAmount(
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
): number {
  return Math.round(monthlyAmount * mapPaymentPeriodToMonths(periodicity));
}

/**
 * The (possibly fractional) monthly amount that reproduces an exact period
 * amount: calculatePeriodAmount(monthlyAmountFromPeriodAmount(p, x), x) === p
 * for every realistic integer-cent price p.
 */
export function monthlyAmountFromPeriodAmount(
  periodAmount: number,
  periodicity: PaymentPeriodicity
): number {
  return periodAmount / mapPaymentPeriodToMonths(periodicity);
}

export const periodicityPriceSchema = z
  .object({
    periodicity: z.nativeEnum(PaymentPeriodicity),
    label: z.string().trim().min(1).max(60).nullish(),
    amountMin: z.number().int().min(0).nullish(),
    amountTarget: z.number().int().min(0).nullish(),
    amountMax: z.number().int().min(0).nullish(),
  })
  .refine(
    price =>
      price.amountMin != null ||
      (price.amountTarget == null && price.amountMax == null),
    {
      message: 'amountTarget and amountMax require amountMin',
    }
  )
  .refine(
    price =>
      price.amountMin == null ||
      price.amountMax == null ||
      price.amountMax >= price.amountMin,
    {
      message: 'amountMax has to be greater or equal amountMin',
    }
  )
  .refine(
    price =>
      price.amountMin == null ||
      price.amountTarget == null ||
      (price.amountTarget >= price.amountMin &&
        (price.amountMax == null || price.amountTarget <= price.amountMax)),
    {
      message: 'amountTarget has to be between amountMin and amountMax',
    }
  );

export const periodicityPricingSchema = z
  .array(periodicityPriceSchema)
  .min(1, 'at least one periodicity price is required')
  .refine(
    prices =>
      new Set(prices.map(({ periodicity }) => periodicity)).size ===
      prices.length,
    {
      message: 'Only one price per periodicity is allowed',
    }
  )
  .refine(prices => prices.some(price => price.amountMin != null), {
    message: 'at least one periodicity price must define amountMin',
  });

export type PeriodicityPriceValue = z.infer<typeof periodicityPriceSchema>;
export type PeriodicityPricingValue = z.infer<typeof periodicityPricingSchema>;

type PeriodicityPriceRow = {
  periodicity: PaymentPeriodicity;
  label?: string | null;
  amountMin?: number | null;
  amountTarget?: number | null;
  amountMax?: number | null;
};

type MemberPlanAmounts = {
  periodicityPricing: PeriodicityPriceRow[];
};

function getBasePriceRow(
  rows: PeriodicityPriceRow[]
): PeriodicityPriceRow | undefined {
  const monthly = rows.find(
    row => row.periodicity === PaymentPeriodicity.monthly
  );

  if (monthly?.amountMin != null) {
    return monthly;
  }

  const priced = rows.filter(row => row.amountMin != null);
  const nonLifetime = priced.filter(
    row => row.periodicity !== PaymentPeriodicity.lifetime
  );
  const candidates = nonLifetime.length ? nonLifetime : priced;

  return candidates.reduce<PeriodicityPriceRow | undefined>((cheapest, row) => {
    if (!cheapest) {
      return row;
    }

    const perMonth = (candidate: PeriodicityPriceRow) =>
      candidate.amountMin! / mapPaymentPeriodToMonths(candidate.periodicity);

    return perMonth(row) < perMonth(cheapest) ? row : cheapest;
  }, undefined);
}

/**
 * Resolves the effective min/target/max amounts (integer cents) for one full
 * payment period of a member plan. The price rows are the only source: the
 * requested periodicity's own row wins per field; missing fields derive from
 * the base row (the monthly row, else the cheapest priced row per month).
 */
export function getPeriodPriceRange(
  memberPlan: MemberPlanAmounts,
  periodicity: PaymentPeriodicity
): {
  amountMin: number;
  amountTarget: number | null;
  amountMax: number | null;
} {
  const row = memberPlan.periodicityPricing.find(
    price => price.periodicity === periodicity
  );
  const base = getBasePriceRow(memberPlan.periodicityPricing);

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
}

/**
 * Monthly-equivalent min/target/max (integer cents) — for sorting, upgrade
 * eligibility and "from CHF X/month" display.
 */
export function getMonthlyEquivalentRange(memberPlan: MemberPlanAmounts): {
  amountMin: number;
  amountTarget: number | null;
  amountMax: number | null;
} {
  return getPeriodPriceRange(memberPlan, PaymentPeriodicity.monthly);
}
