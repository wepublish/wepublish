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
    periodicity: z
      .nativeEnum(PaymentPeriodicity)
      .refine(periodicity => periodicity !== PaymentPeriodicity.monthly, {
        message: 'monthly prices always derive from the amountPerMonth fields',
      }),
    amountMin: z.number().int().min(0),
    amountTarget: z.number().int().min(0).nullish(),
    amountMax: z.number().int().min(0).nullish(),
  })
  .refine(
    price => price.amountMax == null || price.amountMax >= price.amountMin,
    {
      message: 'amountMax has to be greater or equal amountMin',
    }
  )
  .refine(
    price =>
      price.amountTarget == null ||
      (price.amountTarget >= price.amountMin &&
        (price.amountMax == null || price.amountTarget <= price.amountMax)),
    {
      message: 'amountTarget has to be between amountMin and amountMax',
    }
  );

export const periodicityPricingSchema = z
  .array(periodicityPriceSchema)
  .refine(
    prices =>
      new Set(prices.map(({ periodicity }) => periodicity)).size ===
      prices.length,
    {
      message: 'Only one price per periodicity is allowed',
    }
  );

export type PeriodicityPriceValue = z.infer<typeof periodicityPriceSchema>;
export type PeriodicityPricingValue = z.infer<typeof periodicityPricingSchema>;

type MemberPlanAmounts = {
  amountPerMonthMin: number;
  amountPerMonthTarget?: number | null;
  amountPerMonthMax?: number | null;
  periodicityPricing?: unknown;
};

export function parsePeriodicityPricing(
  value: unknown
): PeriodicityPricingValue {
  const parsed = periodicityPricingSchema.safeParse(value);

  return parsed.success ? parsed.data : [];
}

/**
 * Resolves the effective min/target/max amounts (integer cents) for one full
 * payment period of a member plan. Explicit per-periodicity prices take
 * precedence; otherwise the amounts derive from the monthly fields.
 */
export function getPeriodPriceRange(
  memberPlan: MemberPlanAmounts,
  periodicity: PaymentPeriodicity
): {
  amountMin: number;
  amountTarget: number | null;
  amountMax: number | null;
} {
  const override = parsePeriodicityPricing(memberPlan.periodicityPricing).find(
    price => price.periodicity === periodicity
  );

  const amountMin =
    override?.amountMin ??
    calculatePeriodAmount(memberPlan.amountPerMonthMin, periodicity);
  const amountTarget =
    override?.amountTarget ??
    (memberPlan.amountPerMonthTarget != null ?
      calculatePeriodAmount(memberPlan.amountPerMonthTarget, periodicity)
    : null);
  const amountMax =
    override?.amountMax ??
    (memberPlan.amountPerMonthMax != null ?
      calculatePeriodAmount(memberPlan.amountPerMonthMax, periodicity)
    : null);

  return { amountMin, amountTarget, amountMax };
}
