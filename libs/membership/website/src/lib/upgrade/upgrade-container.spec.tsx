import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockAvailablePaymentMethod,
  mockMemberPlan,
  mockOperation,
  mockPaginated,
  mockPayment,
  mockPeriodicityPrice,
  mockSensitiveDataUser,
  mockSubscription,
  mockUpgradeSubscriptionInfo,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  Currency,
  FullMemberPlanFragment,
  MemberPlanListDocument,
  PaymentPeriodicity,
  PaymentState,
  SubscriptionsDocument,
  UpgradeDocument,
  UpgradeSubscriptionInfoDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { formatCurrency } from '../formatters/format-currency';
import { UpgradeContainer } from './upgrade-container';

const lifetimePaymentMethod = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [PaymentPeriodicity.Lifetime],
});

const currentPlan = mockMemberPlan({
  name: 'Current',
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Yearly,
      ],
    }),
    lifetimePaymentMethod,
  ],
});

const plusPlan = mockMemberPlan({
  name: 'Plus',
  successPage: { __typename: 'Page', url: '/abo/danke' },
  failPage: { __typename: 'Page', url: '/abo/fehler' },
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
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      forceAutoRenewal: true,
      paymentPeriodicities: [PaymentPeriodicity.Lifetime],
    }),
  ],
});

const subscription = mockSubscription({
  memberPlan: currentPlan,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const memberPlanListQuery = mockOperation(MemberPlanListDocument, {
  variables: { take: 50, filter: { active: true } },
  data: {
    __typename: 'Query',
    memberPlans: mockPaginated('PaginatedMemberPlans', [
      premiumPlan,
      currentPlan,
      plusPlan,
    ]),
  },
});

const subscriptionsQuery = mockOperation(SubscriptionsDocument, {
  data: { __typename: 'Query', userSubscriptions: [subscription] },
});

const upgradeInfoQuery = (
  plan: FullMemberPlanFragment,
  discountAmount: number
) =>
  mockOperation(UpgradeSubscriptionInfoDocument, {
    variables: {
      memberPlanId: plan.id,
      subscriptionId: subscription.id,
      discountCode: '',
    },
    data: {
      __typename: 'Query',
      upgradeUserSubscriptionInfo: mockUpgradeSubscriptionInfo({
        discountAmount,
      }),
    },
  });

const upgradeButton = (amount: number, plan: FullMemberPlanFragment) =>
  screen.findByRole(
    'button',
    {
      name: t('subscribe.upgrade.button', {
        formattedAmount: formatCurrency(amount, Currency.Chf),
        memberPlan: plan.name,
      }),
    },
    { timeout: 10_000 }
  );

const renderContainer = (
  props: Partial<Parameters<typeof UpgradeContainer>[0]> = {},
  mocks: ReadonlyArray<MockLink.MockedResponse> = [
    memberPlanListQuery,
    subscriptionsQuery,
    upgradeInfoQuery(plusPlan, 500),
    upgradeInfoQuery(premiumPlan, 800),
  ]
) =>
  renderWithProviders(
    <UpgradeContainer
      upgradeSubscriptionId={subscription.id}
      {...props}
    />,
    { user: mockSensitiveDataUser(), mocks }
  );

describe('UpgradeContainer', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('offers the cheapest higher plan minus the leftover the API reports', async () => {
    renderContainer();

    expect(await upgradeButton(91, plusPlan)).toBeInTheDocument();
    expect(
      screen.getByLabelText(plusPlan.name, { exact: false })
    ).toBeChecked();
  });

  it('fetches the leftover again when the reader picks another plan', async () => {
    const user = userEvent.setup();
    renderContainer();

    await upgradeButton(91, plusPlan);
    await user.click(screen.getByLabelText(premiumPlan.name, { exact: false }));

    expect(await upgradeButton(136, premiumPlan)).toBeInTheDocument();
  });

  it('only offers the plans the filter keeps', async () => {
    renderContainer(
      { filter: plans => plans.filter(plan => plan.id === plusPlan.id) },
      [memberPlanListQuery, subscriptionsQuery, upgradeInfoQuery(plusPlan, 500)]
    );

    expect(await upgradeButton(91, plusPlan)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(premiumPlan.name, { exact: false })
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the subscription to upgrade is not the reader’s', async () => {
    renderContainer({ upgradeSubscriptionId: 'someone-elses' }, [
      memberPlanListQuery,
      subscriptionsQuery,
    ]);

    await waitFor(() =>
      expect(
        screen.queryByText(t('subscribe.upgrade.infoTitle'))
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sends the upgrade with the absolute redirect pages of the chosen plan and redirects once paid', async () => {
    const user = userEvent.setup();
    renderContainer({}, [
      memberPlanListQuery,
      subscriptionsQuery,
      upgradeInfoQuery(plusPlan, 500),
      mockOperation(UpgradeDocument, {
        variables: {
          subscriptionId: subscription.id,
          memberPlanId: plusPlan.id,
          paymentMethodId: lifetimePaymentMethod.paymentMethods[0].id,
          monthlyAmount: 800,
          goodieId: null,
          discountCode: '',
          successURL: `${window.location.origin}/abo/danke`,
          failureURL: `${window.location.origin}/abo/fehler`,
        },
        data: {
          __typename: 'Mutation',
          upgradeUserSubscription: mockPayment({ state: PaymentState.Paid }),
        },
      }),
    ]);

    await user.click(await upgradeButton(91, plusPlan));

    await waitFor(() =>
      expect(window.location.href).toBe(`${window.location.origin}/abo/danke`)
    );
  });

  it('redirects to the fail page with the message when the upgrade fails', async () => {
    const user = userEvent.setup();
    renderContainer({}, [
      memberPlanListQuery,
      subscriptionsQuery,
      upgradeInfoQuery(plusPlan, 500),
      mockOperation(UpgradeDocument, {
        variables: {
          subscriptionId: subscription.id,
          memberPlanId: plusPlan.id,
          paymentMethodId: lifetimePaymentMethod.paymentMethods[0].id,
          monthlyAmount: 800,
          goodieId: null,
          discountCode: '',
          successURL: `${window.location.origin}/abo/danke`,
          failureURL: `${window.location.origin}/abo/fehler`,
        },
        errors: [{ message: 'Card declined' }],
      }),
    ]);

    await user.click(await upgradeButton(91, plusPlan));

    await waitFor(() =>
      expect(window.location.href).toBe(
        `${window.location.origin}/abo/fehler?error=Card%20declined`
      )
    );
  });
});
