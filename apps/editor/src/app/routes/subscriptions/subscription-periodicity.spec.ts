import { PaymentPeriodicity } from '@wepublish/editor/api';

import {
  offeredPeriodicities,
  periodicityForPlan,
  selectablePeriodicities,
} from './subscription-periodicity';

const price = (periodicity: PaymentPeriodicity) => ({ periodicity });

const yearlyOnly = {
  periodicityPricing: [price(PaymentPeriodicity.Yearly)],
  defaultPaymentPeriodicity: null,
};
const lifelong = {
  periodicityPricing: [price(PaymentPeriodicity.Lifetime)],
  defaultPaymentPeriodicity: null,
};
const monthlyOrYearly = {
  periodicityPricing: [
    price(PaymentPeriodicity.Yearly),
    price(PaymentPeriodicity.Monthly),
  ],
  defaultPaymentPeriodicity: PaymentPeriodicity.Monthly,
};
const unpriced = { periodicityPricing: [], defaultPaymentPeriodicity: null };

describe('offeredPeriodicities', () => {
  it('is what the plan has a price for, shortest first', () => {
    expect(offeredPeriodicities(monthlyOrYearly)).toEqual([
      PaymentPeriodicity.Monthly,
      PaymentPeriodicity.Yearly,
    ]);
  });

  it('is every periodicity for a plan without prices', () => {
    expect(offeredPeriodicities(unpriced)).toHaveLength(
      Object.values(PaymentPeriodicity).length
    );
  });

  it('is every periodicity while no plan is chosen', () => {
    expect(offeredPeriodicities(undefined)).toHaveLength(
      Object.values(PaymentPeriodicity).length
    );
  });
});

describe('selectablePeriodicities', () => {
  it('offers only what the plan offers', () => {
    expect(
      selectablePeriodicities(lifelong, PaymentPeriodicity.Lifetime)
    ).toEqual([PaymentPeriodicity.Lifetime]);
  });

  it('keeps the periodicity an existing subscription already has', () => {
    expect(
      selectablePeriodicities(lifelong, PaymentPeriodicity.Yearly)
    ).toEqual([PaymentPeriodicity.Yearly, PaymentPeriodicity.Lifetime]);
  });
});

describe('periodicityForPlan', () => {
  it('takes the only periodicity of the plan for a new subscription', () => {
    expect(
      periodicityForPlan(lifelong, PaymentPeriodicity.Yearly, { isNew: true })
    ).toBe(PaymentPeriodicity.Lifetime);
  });

  it('takes the default of a plan with several for a new subscription', () => {
    expect(
      periodicityForPlan(monthlyOrYearly, PaymentPeriodicity.Yearly, {
        isNew: true,
      })
    ).toBe(PaymentPeriodicity.Monthly);
  });

  it('takes the shortest when the plan has several and names no default', () => {
    expect(
      periodicityForPlan(
        { ...monthlyOrYearly, defaultPaymentPeriodicity: null },
        PaymentPeriodicity.Lifetime,
        { isNew: true }
      )
    ).toBe(PaymentPeriodicity.Monthly);
  });

  it('ignores a default the plan has no price for', () => {
    expect(
      periodicityForPlan(
        {
          ...yearlyOnly,
          defaultPaymentPeriodicity: PaymentPeriodicity.Monthly,
        },
        PaymentPeriodicity.Lifetime,
        { isNew: true }
      )
    ).toBe(PaymentPeriodicity.Yearly);
  });

  it('keeps the periodicity of an existing subscription the new plan offers too', () => {
    expect(
      periodicityForPlan(monthlyOrYearly, PaymentPeriodicity.Yearly, {
        isNew: false,
      })
    ).toBe(PaymentPeriodicity.Yearly);
  });

  it('moves an existing subscription to the default when the new plan does not offer its periodicity', () => {
    expect(
      periodicityForPlan(monthlyOrYearly, PaymentPeriodicity.Lifetime, {
        isNew: false,
      })
    ).toBe(PaymentPeriodicity.Monthly);
  });

  it('leaves the periodicity alone for a plan without prices', () => {
    expect(
      periodicityForPlan(unpriced, PaymentPeriodicity.Quarterly, {
        isNew: true,
      })
    ).toBe(PaymentPeriodicity.Quarterly);
  });
});
