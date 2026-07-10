import { PaymentPeriodicity } from '@prisma/client';
import {
  calculatePeriodAmount,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
  periodicityPricingSchema,
} from './periodicity-pricing';

describe('calculatePeriodAmount', () => {
  it('multiplies integer monthly amounts by the period months', () => {
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.monthly)).toBe(4500);
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.quarterly)).toBe(
      13500
    );
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.biannual)).toBe(
      27000
    );
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.yearly)).toBe(54000);
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.biennial)).toBe(
      108000
    );
    expect(calculatePeriodAmount(4500, PaymentPeriodicity.lifetime)).toBe(
      5400000
    );
  });

  it('reproduces every exact period amount from its fractional monthly amount', () => {
    const periodicities = Object.values(PaymentPeriodicity);
    const periodAmounts = [
      1, 99, 5000, 50000, 20000, 12345, 99999, 100000, 1000001,
    ];

    for (const periodicity of periodicities) {
      for (const periodAmount of periodAmounts) {
        const monthlyAmount = monthlyAmountFromPeriodAmount(
          periodAmount,
          periodicity
        );

        expect(calculatePeriodAmount(monthlyAmount, periodicity)).toBe(
          periodAmount
        );
      }
    }
  });

  it('makes CHF 500.00 per year exactly representable', () => {
    const monthlyAmount = monthlyAmountFromPeriodAmount(
      50000,
      PaymentPeriodicity.yearly
    );

    expect(monthlyAmount).not.toBe(Math.round(monthlyAmount));
    expect(
      calculatePeriodAmount(monthlyAmount, PaymentPeriodicity.yearly)
    ).toBe(50000);
  });
});

describe('periodicityPricingSchema', () => {
  it('accepts a valid pricing list', () => {
    const result = periodicityPricingSchema.safeParse([
      {
        periodicity: PaymentPeriodicity.yearly,
        amountMin: 45000,
        amountTarget: 50000,
        amountMax: 68000,
      },
      { periodicity: PaymentPeriodicity.quarterly, amountMin: 13000 },
    ]);

    expect(result.success).toBe(true);
  });

  it('rejects a monthly price entry', () => {
    const result = periodicityPricingSchema.safeParse([
      { periodicity: PaymentPeriodicity.monthly, amountMin: 4500 },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects duplicate periodicities', () => {
    const result = periodicityPricingSchema.safeParse([
      { periodicity: PaymentPeriodicity.yearly, amountMin: 45000 },
      { periodicity: PaymentPeriodicity.yearly, amountMin: 50000 },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects amountMax below amountMin', () => {
    const result = periodicityPricingSchema.safeParse([
      {
        periodicity: PaymentPeriodicity.yearly,
        amountMin: 50000,
        amountMax: 45000,
      },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects amountTarget outside min/max', () => {
    const result = periodicityPricingSchema.safeParse([
      {
        periodicity: PaymentPeriodicity.yearly,
        amountMin: 45000,
        amountTarget: 70000,
        amountMax: 68000,
      },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects fractional and negative amounts', () => {
    expect(
      periodicityPricingSchema.safeParse([
        { periodicity: PaymentPeriodicity.yearly, amountMin: 45000.5 },
      ]).success
    ).toBe(false);

    expect(
      periodicityPricingSchema.safeParse([
        { periodicity: PaymentPeriodicity.yearly, amountMin: -1 },
      ]).success
    ).toBe(false);
  });
});

describe('getPeriodPriceRange', () => {
  const memberPlan = {
    amountPerMonthMin: 4000,
    amountPerMonthTarget: 4500,
    amountPerMonthMax: 6000,
    periodicityPricing: [
      {
        periodicity: PaymentPeriodicity.yearly,
        amountMin: 44000,
        amountTarget: 50000,
        amountMax: 68000,
      },
    ],
  };

  it('uses the explicit per-periodicity prices when configured', () => {
    expect(getPeriodPriceRange(memberPlan, PaymentPeriodicity.yearly)).toEqual({
      amountMin: 44000,
      amountTarget: 50000,
      amountMax: 68000,
    });
  });

  it('derives from the monthly amounts when not configured', () => {
    expect(
      getPeriodPriceRange(memberPlan, PaymentPeriodicity.quarterly)
    ).toEqual({
      amountMin: 12000,
      amountTarget: 13500,
      amountMax: 18000,
    });
  });

  it('keeps optional amounts null when the plan has no target/max', () => {
    expect(
      getPeriodPriceRange(
        { amountPerMonthMin: 4000, periodicityPricing: null },
        PaymentPeriodicity.yearly
      )
    ).toEqual({
      amountMin: 48000,
      amountTarget: null,
      amountMax: null,
    });
  });

  it('never lets a monthly entry override the monthly amounts', () => {
    expect(
      getPeriodPriceRange(
        {
          amountPerMonthMin: 4000,
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.monthly, amountMin: 9900 },
          ],
        },
        PaymentPeriodicity.monthly
      )
    ).toEqual({
      amountMin: 4000,
      amountTarget: null,
      amountMax: null,
    });
  });

  it('ignores malformed pricing data', () => {
    expect(
      getPeriodPriceRange(
        {
          amountPerMonthMin: 4000,
          periodicityPricing: { yearly: 'broken' },
        },
        PaymentPeriodicity.yearly
      )
    ).toEqual({
      amountMin: 48000,
      amountTarget: null,
      amountMax: null,
    });
  });
});
