import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPaymentMethod,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullMemberPlanFragment,
  PaymentPeriodicity,
  ProductType,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';

import { subscriptionFixture } from '../membership.fixtures';
import { canUpgrade } from './can-upgrade';

const plan = (
  id: string,
  monthlyMin: number,
  periodicities = [PaymentPeriodicity.Yearly],
  overrides: Partial<FullMemberPlanFragment> = {}
) =>
  mockMemberPlan({
    id,
    name: id,
    availablePaymentMethods: [
      mockAvailablePaymentMethod({ paymentPeriodicities: periodicities }),
    ],
    periodicityPricing: [
      {
        __typename: 'PeriodicityPrice',
        periodicity: PaymentPeriodicity.Monthly,
        label: null,
        amountMin: monthlyMin,
        amountTarget: null,
        amountMax: null,
      },
    ],
    ...overrides,
  });

const yearly = plan('jahresabo', 700);
const solidarity = plan('solidaritaetsabo', 1250);

const subscription = (
  overrides: Parameters<typeof subscriptionFixture>[1] = {}
) =>
  subscriptionFixture(
    { memberPlan: yearly, paymentMethod: mockPaymentMethod() },
    { paymentPeriodicity: PaymentPeriodicity.Yearly, ...overrides }
  );

describe('canUpgrade', () => {
  it('is possible to a more expensive plan with the same billing period', () => {
    expect(canUpgrade(subscription(), [yearly, solidarity])).toBe(true);
  });

  it('is not possible when no plan costs more', () => {
    expect(canUpgrade(subscription(), [yearly, plan('cheaper', 300)])).toBe(
      false
    );
  });

  it('is not possible to a plan without the billing period', () => {
    expect(
      canUpgrade(subscription(), [
        yearly,
        plan('monthly-only', 1250, [PaymentPeriodicity.Monthly]),
      ])
    ).toBe(false);
  });

  it('is not possible to a plan that cannot be extended', () => {
    expect(
      canUpgrade(subscription(), [
        yearly,
        plan('one-off', 1250, undefined, { extendable: false }),
      ])
    ).toBe(false);
  });

  it('is not possible for a donation', () => {
    const donation = plan('spende', 700, undefined, {
      productType: ProductType.Donation,
    });

    expect(
      canUpgrade(
        subscriptionFixture(
          { memberPlan: donation, paymentMethod: mockPaymentMethod() },
          { paymentPeriodicity: PaymentPeriodicity.Yearly }
        ),
        [
          donation,
          plan('grosse-spende', 1250, undefined, {
            productType: ProductType.Donation,
          }),
        ]
      )
    ).toBe(false);
  });

  it('is not possible to a donation plan', () => {
    expect(
      canUpgrade(subscription(), [
        yearly,
        plan('spende', 1250, undefined, { productType: ProductType.Donation }),
      ])
    ).toBe(false);
  });

  it('is not possible to a plan in another currency', () => {
    expect(
      canUpgrade(subscription(), [
        yearly,
        plan('euro', 1250, undefined, { currency: Currency.Eur }),
      ])
    ).toBe(false);
  });

  // the server credits the rest of a paid period that is still running
  it.each([
    ['nothing has been paid yet', { paidUntil: null }],
    ['its paid period is over', { paidUntil: '2020-01-01T00:00:00.000Z' }],
  ])('is not possible when %s', (_, overrides) => {
    expect(canUpgrade(subscription(overrides), [yearly, solidarity])).toBe(
      false
    );
  });

  it.each([
    [
      'cancelled',
      {
        deactivation: {
          __typename: 'SubscriptionDeactivation' as const,
          date: '2027-01-01T00:00:00.000Z',
          reason: SubscriptionDeactivationReason.UserSelfDeactivated,
        },
      },
    ],
    ['not running', { isActive: false }],
    ['waiting for an upgrade to be paid', { canRevertUpgrade: true }],
  ])('is not possible while it is %s', (_, overrides) => {
    expect(canUpgrade(subscription(overrides), [yearly, solidarity])).toBe(
      false
    );
  });

  it('is not possible during a payment method change', () => {
    expect(
      canUpgrade(
        subscription({
          pendingPaymentMethodChange: {
            __typename: 'SubscriptionPaymentMethodChange',
          } as never,
        }),
        [yearly, solidarity]
      )
    ).toBe(false);
  });
});
