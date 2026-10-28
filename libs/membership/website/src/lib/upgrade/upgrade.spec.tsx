import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockPaginated,
  mockPeriodicityPrice,
  mockSubscription,
  mockUpgradeSubscriptionInfo,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullMemberPlanFragment,
  MemberPlanListQuery,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockRenderLayout,
  UpgradeSubscriptionInfoQuery,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { ComponentProps } from 'react';
import { formatCurrency } from '../formatters/format-currency';
import { Upgrade } from './upgrade';

const allPeriodicities = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly,
    PaymentPeriodicity.Biennial,
    PaymentPeriodicity.Lifetime,
  ],
});

const lifetimePaymentMethod = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [PaymentPeriodicity.Lifetime],
});

const lifetimeForcedAutoRenewalPaymentMethod = mockAvailablePaymentMethod({
  forceAutoRenewal: true,
  paymentPeriodicities: [PaymentPeriodicity.Lifetime],
});

const currentPlan = mockMemberPlan({
  name: 'Current',
  availablePaymentMethods: [
    allPeriodicities,
    lifetimePaymentMethod,
    lifetimeForcedAutoRenewalPaymentMethod,
  ],
});

const plusPlan = mockMemberPlan({
  name: 'Plus',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 800,
      amountTarget: 800,
      amountMax: null,
    }),
  ],
  availablePaymentMethods: [lifetimePaymentMethod],
});

const premiumPlan = mockMemberPlan({
  name: 'Premium',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 1200,
      amountTarget: 1200,
      amountMax: null,
    }),
  ],
  availablePaymentMethods: [lifetimeForcedAutoRenewalPaymentMethod],
});

const donationPlan = mockMemberPlan({
  name: 'Donation',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 1500,
      amountTarget: 1500,
      amountMax: null,
    }),
  ],
  availablePaymentMethods: [lifetimeForcedAutoRenewalPaymentMethod],
  productType: ProductType.Donation,
});

const cheaperPlan = mockMemberPlan({
  name: 'Cheaper',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 100,
      amountTarget: 100,
      amountMax: null,
    }),
  ],
});

const notExtendablePlan = mockMemberPlan({
  name: 'Not extendable',
  extendable: false,
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 2000,
      amountTarget: 2000,
      amountMax: null,
    }),
  ],
});

const subscription = mockSubscription({
  memberPlan: currentPlan,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const memberPlanList = (nodes: FullMemberPlanFragment[]) => ({
  data: {
    __typename: 'Query',
    memberPlans: mockPaginated('PaginatedMemberPlans', nodes),
  } satisfies MemberPlanListQuery,
  loading: false,
  error: undefined,
});

const upgradeInfo = (
  info: UpgradeSubscriptionInfoQuery['upgradeUserSubscriptionInfo']
) => ({
  data: {
    __typename: 'Query',
    upgradeUserSubscriptionInfo: info,
  } satisfies UpgradeSubscriptionInfoQuery,
  loading: false,
  error: undefined,
});

type Props = ComponentProps<typeof Upgrade>;

const renderUpgrade = (props: Partial<Props> = {}) => {
  const onSelect = vi.fn();
  const onUpgrade = vi.fn();

  renderWithProviders(
    <Upgrade
      subscriptionToUpgrade={subscription}
      memberPlans={memberPlanList([
        currentPlan,
        plusPlan,
        premiumPlan,
        donationPlan,
      ])}
      upgradeInfo={upgradeInfo(
        mockUpgradeSubscriptionInfo({ discountAmount: 500 })
      )}
      onSelect={onSelect}
      onUpgrade={onUpgrade}
      {...props}
    />
  );

  return { onSelect, onUpgrade, user: userEvent.setup() };
};

const upgradeButton = (amount: number, plan: FullMemberPlanFragment) =>
  screen.getByRole('button', {
    name: t('subscribe.upgrade.button', {
      formattedAmount: formatCurrency(amount, Currency.Chf),
      memberPlan: plan.name,
    }),
  });

const planRadio = (plan: FullMemberPlanFragment) =>
  screen.getByLabelText(plan.name, { exact: false });

describe('Upgrade', () => {
  it('only offers extendable plans that cost more than the current one', () => {
    renderUpgrade({
      memberPlans: memberPlanList([
        currentPlan,
        cheaperPlan,
        notExtendablePlan,
        plusPlan,
        premiumPlan,
      ]),
    });

    expect(screen.getAllByRole('radio', { name: /Plus|Premium/ })).toHaveLength(
      2
    );
    expect(
      screen.queryByLabelText(cheaperPlan.name, { exact: false })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(notExtendablePlan.name, { exact: false })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(currentPlan.name, { exact: false })
    ).not.toBeInTheDocument();
  });

  it('preselects the cheapest higher plan and charges the price minus the leftover', async () => {
    const { onSelect, onUpgrade, user } = renderUpgrade();

    expect(planRadio(plusPlan)).toBeChecked();
    expect(onSelect).toHaveBeenCalledWith(plusPlan.id, '');

    await user.click(upgradeButton(91, plusPlan));

    await waitFor(() =>
      expect(onUpgrade).toHaveBeenCalledWith({
        subscriptionId: subscription.id,
        memberPlanId: plusPlan.id,
        paymentMethodId: lifetimePaymentMethod.paymentMethods[0].id,
        monthlyAmount: 800,
        goodieId: null,
        discountCode: '',
      })
    );
  });

  it('adds the transaction fee when the reader opts in', async () => {
    const { onUpgrade, user } = renderUpgrade({
      transactionFeeText: 'Ich übernehme die Gebühren',
    });

    await user.click(
      screen.getByRole('checkbox', { name: 'Ich übernehme die Gebühren' })
    );
    await user.click(screen.getByRole('button', { name: /Plus/ }));

    await waitFor(() =>
      expect(onUpgrade).toHaveBeenCalledWith(
        expect.objectContaining({ monthlyAmount: 820 })
      )
    );
  });

  it('switches to the payment methods of a newly chosen plan', async () => {
    const { onSelect, onUpgrade, user } = renderUpgrade();

    await user.click(planRadio(premiumPlan));

    expect(onSelect).toHaveBeenLastCalledWith(premiumPlan.id, '');

    await user.click(upgradeButton(139, premiumPlan));

    await waitFor(() =>
      expect(onUpgrade).toHaveBeenCalledWith(
        expect.objectContaining({
          memberPlanId: premiumPlan.id,
          paymentMethodId:
            lifetimeForcedAutoRenewalPaymentMethod.paymentMethods[0].id,
          monthlyAmount: 1200,
        })
      )
    );
  });

  it('upgrades with the payment method the reader picks', async () => {
    const { onUpgrade, user } = renderUpgrade();
    const paymentMethod = lifetimePaymentMethod.paymentMethods[1];

    await user.click(
      screen.getByRole('radio', {
        name: `${paymentMethod.description} ${paymentMethod.name}`,
      })
    );
    await user.click(upgradeButton(91, plusPlan));

    await waitFor(() =>
      expect(onUpgrade).toHaveBeenCalledWith(
        expect.objectContaining({
          memberPlanId: plusPlan.id,
          paymentMethodId: paymentMethod.id,
        })
      )
    );
  });

  it('shows the error when the upgrade fails', async () => {
    const { onUpgrade, user } = renderUpgrade();

    onUpgrade.mockRejectedValue(new Error('Something went wrong.'));
    await user.click(upgradeButton(91, plusPlan));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
  });

  it('preselects the plan given by its slug', () => {
    const { onSelect } = renderUpgrade({
      defaults: { memberPlanSlug: donationPlan.slug },
    });

    expect(planRadio(donationPlan)).toBeChecked();
    expect(onSelect).toHaveBeenCalledWith(donationPlan.id, '');
  });

  it('takes the discount off the price after the leftover', () => {
    renderUpgrade({
      showDiscountCodes: true,
      upgradeInfo: upgradeInfo(
        mockUpgradeSubscriptionInfo({
          discountAmount: 500,
          discountPercent: 0.2,
          discountCodeValid: true,
        })
      ),
    });

    expect(
      screen.getByText(
        t('subscribe.discountCode.discountApplied', { discountPercent: 20 })
      )
    ).toBeInTheDocument();
    expect(upgradeButton(72.8, plusPlan)).toBeInTheDocument();
  });

  it('asks for upgrade info with the discount code the reader enters', async () => {
    const { onSelect, user } = renderUpgrade({ showDiscountCodes: true });

    await user.type(
      screen.getByLabelText(t('subscribe.discountCode.label')),
      'SAVE'
    );

    expect(onSelect).toHaveBeenLastCalledWith(plusPlan.id, 'SAVE');
  });

  it('marks an invalid discount code and does not upgrade', async () => {
    const { onUpgrade, user } = renderUpgrade({
      showDiscountCodes: true,
      upgradeInfo: upgradeInfo(
        mockUpgradeSubscriptionInfo({
          discountAmount: 500,
          discountPercent: null,
          discountCodeValid: false,
        })
      ),
    });

    expect(
      screen.getByText(t('subscribe.discountCode.invalid'))
    ).toBeInTheDocument();

    await user.click(upgradeButton(91, plusPlan));

    expect(onUpgrade).not.toHaveBeenCalled();
  });

  it('never charges a negative amount when the leftover exceeds the price', () => {
    renderUpgrade({
      upgradeInfo: upgradeInfo(
        mockUpgradeSubscriptionInfo({
          discountAmount: 100000,
          discountPercent: 0.2,
          discountCodeValid: true,
        })
      ),
    });

    expect(upgradeButton(0, plusPlan)).toBeInTheDocument();
  });

  it('upgrades to the monthly amount of a picked yearly amount tile', async () => {
    const { onUpgrade, user } = renderUpgrade({
      memberPlanRenderSettings: [
        {
          __typename: 'SubscribeBlockMemberPlanRenderSetting',
          memberPlanId: plusPlan.id,
          isDefault: true,
          layout: {
            __typename: 'SubscribeBlockLayoutPickerConfig',
            type: SubscribeBlockRenderLayout.Picker,
            showInput: true,
            values: [1000, 1500, 2000],
            valuesByPeriodicity: [],
          },
        },
      ],
    });

    await user.click(screen.getByText('120', { exact: true }));
    await user.click(screen.getByRole('button', { name: /Plus/ }));

    await waitFor(() =>
      expect(onUpgrade).toHaveBeenCalledWith(
        expect.objectContaining({ monthlyAmount: 1000 })
      )
    );
  });
});
