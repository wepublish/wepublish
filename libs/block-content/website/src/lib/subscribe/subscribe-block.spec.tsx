import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockMemberPlan,
  mockPeriodicityPrice,
  mockSensitiveDataUser,
  mockSubscribeBlock,
  mockSubscription,
  createSubscribeBlockContext,
  renderWithProviders,
  TestSubscribeBlockOptions,
} from '@wepublish/mocks/website';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscribeBlockField,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { SubscribeBlock } from './subscribe-block';

const loaded = <TData,>(data: TData) => ({
  data,
  loading: false,
  error: undefined,
});

const basic = mockMemberPlan({ name: 'Basic', slug: 'basic' });
const premium = mockMemberPlan({
  name: 'Premium',
  slug: 'premium',
  periodicityPricing: [
    mockPeriodicityPrice({
      periodicity: PaymentPeriodicity.Monthly,
      amountMin: 10000,
      amountTarget: 15000,
      amountMax: null,
    }),
  ],
});

const subscriptionToUpgrade = mockSubscription({
  id: 'subscription-to-upgrade',
  monthlyAmount: 100,
  memberPlan: mockMemberPlan({
    name: 'Starter',
    periodicityPricing: [
      mockPeriodicityPrice({
        periodicity: PaymentPeriodicity.Monthly,
        amountMin: 100,
        amountTarget: null,
        amountMax: null,
      }),
    ],
  }),
});

const renderSubscribeBlock = ({
  fields = [],
  memberPlans = [basic, premium],
  loggedIn = false,
  subscriptions = [],
  query,
  ...context
}: TestSubscribeBlockOptions & {
  fields?: SubscribeBlockField[];
  memberPlans?: ReturnType<typeof mockMemberPlan>[];
  loggedIn?: boolean;
  subscriptions?: FullSubscriptionFragment[];
  query?: Record<string, string>;
} = {}) => {
  const subscribeBlock = createSubscribeBlockContext({
    challenge: loaded({ __typename: 'Query', challenge: mockChallenge() }),
    userInvoices: loaded({ __typename: 'Query', userInvoices: [] }),
    userSubscriptions: loaded({
      __typename: 'Query',
      userSubscriptions: subscriptions,
    }),
    ...context,
  });

  const result = renderWithProviders(
    <SubscribeBlock {...mockSubscribeBlock({ memberPlans, fields })} />,
    {
      subscribeBlock,
      user: loggedIn ? mockSensitiveDataUser() : null,
      router: { query },
    }
  );

  return { ...result, subscribeBlock };
};

const submitButton = (container: HTMLElement) => {
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]'
  );

  if (!button) {
    throw new Error('The subscribe form has no submit button');
  }

  return button;
};

describe('SubscribeBlock', () => {
  it('offers the member plans of the block', () => {
    renderSubscribeBlock();

    expect(
      screen.getByRole('heading', { name: t('subscribe.chooseSubscription') })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Basic', { exact: false })).toBeChecked();
    expect(
      screen.getByLabelText('Premium', { exact: false })
    ).not.toBeChecked();
  });

  it('asks guests only for the fields the block wants', () => {
    renderSubscribeBlock({ fields: [SubscribeBlockField.FirstName] });

    expect(screen.getByLabelText(t('user.form.firstName'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('user.form.email'))).toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('user.form.password'))
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('user.form.street'))
    ).not.toBeInTheDocument();
  });

  it('prefills the form from the URL', () => {
    renderSubscribeBlock({
      fields: [SubscribeBlockField.FirstName],
      query: {
        memberPlanBySlug: 'premium',
        mail: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });

    expect(screen.getByLabelText('Premium', { exact: false })).toBeChecked();
    expect(screen.getByLabelText(t('user.form.email'))).toHaveValue(
      'jane@example.com'
    );
    expect(screen.getByLabelText(t('user.form.firstName'))).toHaveValue('Jane');
    expect(screen.getByLabelText(t('user.form.lastName'))).toHaveValue('Doe');
  });

  it('subscribes a logged in user to the selected member plan', async () => {
    const user = userEvent.setup();
    const { container, subscribeBlock } = renderSubscribeBlock({
      loggedIn: true,
      subscribeResult: { data: undefined },
    });

    await user.click(screen.getByLabelText('Premium', { exact: false }));
    await user.click(submitButton(container));

    await waitFor(() =>
      expect(subscribeBlock.subscribe).toHaveBeenCalledWith(premium, {
        variables: expect.objectContaining({ memberPlanId: premium.id }),
      })
    );
  });

  it('shows the error when subscribing fails', async () => {
    const user = userEvent.setup();
    const { container } = renderSubscribeBlock({
      loggedIn: true,
      subscribeResult: { error: new Error('The payment provider is down.') },
    });

    await user.click(submitButton(container));

    expect(
      await screen.findByText('The payment provider is down.', {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it('offers to upgrade the active subscription from the URL', async () => {
    const { subscribeBlock } = renderSubscribeBlock({
      loggedIn: true,
      memberPlans: [premium],
      subscriptions: [subscriptionToUpgrade],
      query: {
        upgradeSubscriptionId: subscriptionToUpgrade.id,
        discountCode: 'SAVE10',
      },
      upgradeInfoResult: {
        data: {
          __typename: 'Query',
          upgradeUserSubscriptionInfo: {
            __typename: 'UpgradeSubscription',
            discountAmount: 50,
            discountPercent: null,
            discountCodeValid: null,
          },
        },
      },
    });

    expect(
      await screen.findByText(t('subscribe.upgrade.infoTitle'))
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: t('subscribe.chooseSubscription') })
    ).not.toBeInTheDocument();
    expect(subscribeBlock.upgradeInfo[0]).toHaveBeenCalledWith({
      variables: {
        memberPlanId: premium.id,
        subscriptionId: subscriptionToUpgrade.id,
        discountCode: 'SAVE10',
      },
    });
  });

  it('offers a new subscription when the subscription to upgrade is inactive', () => {
    renderSubscribeBlock({
      loggedIn: true,
      subscriptions: [{ ...subscriptionToUpgrade, isActive: false }],
      query: { upgradeSubscriptionId: subscriptionToUpgrade.id },
    });

    expect(
      screen.getByRole('heading', { name: t('subscribe.chooseSubscription') })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(t('subscribe.upgrade.infoTitle'))
    ).not.toBeInTheDocument();
  });
});
