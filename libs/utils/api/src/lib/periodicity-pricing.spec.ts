import { PaymentPeriodicity } from '@prisma/client';
import {
  calculatePeriodAmount,
  getMonthlyEquivalentRange,
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

  it('accepts a monthly price entry as the base price', () => {
    const result = periodicityPricingSchema.safeParse([
      { periodicity: PaymentPeriodicity.monthly, amountMin: 4500 },
    ]);

    expect(result.success).toBe(true);
  });

  it('rejects an empty pricing list', () => {
    expect(periodicityPricingSchema.safeParse([]).success).toBe(false);
  });

  it('rejects a pricing list without any amountMin', () => {
    const result = periodicityPricingSchema.safeParse([
      { periodicity: PaymentPeriodicity.monthly, label: 'Beliebteste Wahl' },
      { periodicity: PaymentPeriodicity.yearly, label: 'Jahresabo' },
    ]);

    expect(result.success).toBe(false);
  });

  it('accepts labels on price entries and label-only non-monthly entries', () => {
    const result = periodicityPricingSchema.safeParse([
      {
        periodicity: PaymentPeriodicity.yearly,
        label: '2 Monate geschenkt',
        amountMin: 45000,
      },
      { periodicity: PaymentPeriodicity.quarterly, label: 'Flexibel' },
    ]);

    expect(result.success).toBe(true);
  });

  it('rejects amountTarget/amountMax without amountMin', () => {
    const result = periodicityPricingSchema.safeParse([
      { periodicity: PaymentPeriodicity.yearly, amountTarget: 50000 },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects empty and overlong labels', () => {
    expect(
      periodicityPricingSchema.safeParse([
        {
          periodicity: PaymentPeriodicity.yearly,
          amountMin: 45000,
          label: ' ',
        },
      ]).success
    ).toBe(false);

    expect(
      periodicityPricingSchema.safeParse([
        {
          periodicity: PaymentPeriodicity.yearly,
          amountMin: 45000,
          label: 'x'.repeat(61),
        },
      ]).success
    ).toBe(false);
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
    periodicityPricing: [
      {
        periodicity: PaymentPeriodicity.monthly,
        amountMin: 4000,
        amountTarget: 4500,
        amountMax: 6000,
      },
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

  it('derives unconfigured periodicities from the monthly row', () => {
    expect(
      getPeriodPriceRange(memberPlan, PaymentPeriodicity.quarterly)
    ).toEqual({
      amountMin: 12000,
      amountTarget: 13500,
      amountMax: 18000,
    });
  });

  it('treats the monthly row as the monthly price', () => {
    expect(getPeriodPriceRange(memberPlan, PaymentPeriodicity.monthly)).toEqual(
      {
        amountMin: 4000,
        amountTarget: 4500,
        amountMax: 6000,
      }
    );
  });

  it('keeps optional amounts null when the base row has no target/max', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.monthly, amountMin: 4000 },
          ],
        },
        PaymentPeriodicity.yearly
      )
    ).toEqual({
      amountMin: 48000,
      amountTarget: null,
      amountMax: null,
    });
  });

  it('derives from the cheapest priced row per month when no monthly row exists', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.yearly, amountMin: 45000 },
            { periodicity: PaymentPeriodicity.biannual, amountMin: 24000 },
          ],
        },
        PaymentPeriodicity.quarterly
      )
    ).toEqual({
      amountMin: 11250,
      amountTarget: null,
      amountMax: null,
    });
  });

  it('ignores lifetime rows as base unless they are the only priced rows', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.lifetime, amountMin: 500000 },
            { periodicity: PaymentPeriodicity.yearly, amountMin: 48000 },
          ],
        },
        PaymentPeriodicity.monthly
      ).amountMin
    ).toBe(4000);

    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.lifetime, amountMin: 1200000 },
          ],
        },
        PaymentPeriodicity.monthly
      ).amountMin
    ).toBe(1000);
  });

  it('ignores label-only rows when picking the base and derives their amounts', () => {
    expect(
      getPeriodPriceRange(
        {
          periodicityPricing: [
            { periodicity: PaymentPeriodicity.monthly, label: 'Beliebt' },
            { periodicity: PaymentPeriodicity.yearly, amountMin: 48000 },
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

  it('falls back to zero when no priced row exists', () => {
    expect(
      getPeriodPriceRange({ periodicityPricing: [] }, PaymentPeriodicity.yearly)
    ).toEqual({
      amountMin: 0,
      amountTarget: null,
      amountMax: null,
    });
  });
});

describe('getMonthlyEquivalentRange', () => {
  it('passes the monthly row through', () => {
    expect(
      getMonthlyEquivalentRange({
        periodicityPricing: [
          {
            periodicity: PaymentPeriodicity.monthly,
            amountMin: 4000,
            amountTarget: 4500,
            amountMax: 6000,
          },
        ],
      })
    ).toEqual({
      amountMin: 4000,
      amountTarget: 4500,
      amountMax: 6000,
    });
  });

  it('derives the monthly equivalent from a yearly-only plan', () => {
    expect(
      getMonthlyEquivalentRange({
        periodicityPricing: [
          { periodicity: PaymentPeriodicity.yearly, amountMin: 50000 },
        ],
      }).amountMin
    ).toBe(4167);
  });
});
