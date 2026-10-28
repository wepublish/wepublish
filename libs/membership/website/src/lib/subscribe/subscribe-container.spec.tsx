import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@wepublish/authentication/website';
import {
  mockAvailablePaymentMethod,
  mockChallenge,
  mockChallengeQuery,
  mockChallengeToken,
  mockCreateSubscriptionInfo,
  mockInvoice,
  mockMemberPlan,
  mockOperation,
  mockPaginated,
  mockPayment,
  mockPeriodicityPrice,
  mockSensitiveDataUser,
  mockSessionWithoutUser,
  mockSubscription,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import {
  ChallengeDocument,
  CreateSubscriptionInfoDocument,
  Currency,
  FullMemberPlanFragment,
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentPeriodicity,
  PaymentState,
  RegisterDocument,
  ResubscribeDocument,
  SubscribeDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { formatCurrency } from '../formatters/format-currency';
import { SubscribeContainer } from './subscribe-container';

const standardPlan = mockMemberPlan({
  name: 'Standard',
  successPage: { __typename: 'Page', url: '/abo/danke' },
  failPage: { __typename: 'Page', url: '/abo/fehler' },
  confirmationPage: { __typename: 'Page', url: '/abo/bestaetigt' },
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Yearly,
        PaymentPeriodicity.Lifetime,
      ],
    }),
  ],
});

const euroPlan = mockMemberPlan({
  name: 'Euro',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 800,
      amountTarget: 800,
      amountMax: null,
    }),
  ],
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      paymentPeriodicities: [PaymentPeriodicity.Monthly],
    }),
  ],
  currency: Currency.Eur,
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
      paymentPeriodicities: [PaymentPeriodicity.Monthly],
    }),
  ],
});

const subscription = mockSubscription({
  memberPlan: standardPlan,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const invoice = mockInvoice({
  total: 5000,
  subscription,
  paidAt: null,
  canceledAt: null,
});

const challenge = mockChallenge({ challengeID: 'subscribe-challenge' });

const memberPlanListQuery = mockOperation(MemberPlanListDocument, {
  variables: { take: 50, filter: { active: true } },
  data: {
    __typename: 'Query',
    memberPlans: mockPaginated('PaginatedMemberPlans', [
      premiumPlan,
      standardPlan,
      euroPlan,
    ]),
  },
});

const subscribeInfoQuery = (plan: FullMemberPlanFragment) =>
  mockOperation(CreateSubscriptionInfoDocument, {
    variables: { memberPlanId: plan.id, discountCode: '' },
    data: {
      __typename: 'Query',
      createSubscriptionInfo: mockCreateSubscriptionInfo(),
    },
  });

const userDataQueries = [
  mockOperation(SubscriptionsDocument, {
    data: { __typename: 'Query', userSubscriptions: [subscription] },
  }),
  mockOperation(InvoicesDocument, {
    data: { __typename: 'Query', userInvoices: [invoice] },
  }),
];

const registerVariables = {
  name: 'Bar',
  email: 'foobar@email.com',
  challengeAnswer: {
    challengeID: 'subscribe-challenge',
    challengeSolution: mockChallengeToken,
  },
};

const subscribeVariables = {
  memberPlanId: standardPlan.id,
  paymentMethodId: standardPlan.availablePaymentMethods[0].paymentMethods[0].id,
  paymentPeriodicity: PaymentPeriodicity.Monthly,
  monthlyAmount: 700,
  autoRenew: true,
  discountCode: '',
  goodieId: null,
};

const redirectUrl = (path: string) => `${window.location.origin}${path}`;

const SessionStatus = () => {
  const { hasUser } = useUser();

  return <p>{hasUser ? 'logged in' : 'logged out'}</p>;
};

const renderContainer = (
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  props: Partial<Parameters<typeof SubscribeContainer>[0]> = {},
  loggedIn = false
) =>
  renderWithProviders(
    <>
      <SessionStatus />
      <SubscribeContainer
        fields={[]}
        {...props}
      />
    </>,
    { mocks, user: loggedIn ? mockSensitiveDataUser() : null }
  );

const subscribeButton = (amount = 7, currency = Currency.Chf) =>
  screen.findByRole(
    'button',
    { name: name => name.includes(formatCurrency(amount, currency)) },
    { timeout: 10_000 }
  );

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText(t('user.form.lastName')), 'Bar');
  await user.type(
    screen.getByLabelText(t('user.form.email')),
    'foobar@email.com'
  );
  await screen.findByRole(
    'group',
    { name: TEST_CAPTCHA_LABEL },
    { timeout: 10_000 }
  );
  await user.click(await subscribeButton());
};

describe('SubscribeContainer', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('preselects the cheapest active plan and asks a logged out reader for spam protection', async () => {
    renderContainer([
      memberPlanListQuery,
      mockChallengeQuery(challenge),
      subscribeInfoQuery(standardPlan),
    ]);

    expect(
      await screen.findByLabelText(
        standardPlan.name,
        { exact: false },
        { timeout: 10_000 }
      )
    ).toBeChecked();
    expect(
      screen.getByLabelText(euroPlan.name, { exact: false })
    ).not.toBeChecked();
    expect(
      screen.getByLabelText(premiumPlan.name, { exact: false })
    ).not.toBeChecked();
    expect(
      screen.getByRole('heading', { name: t('subscribe.spamProtection') })
    ).toBeInTheDocument();
  });

  it('warns a logged in reader about the open invoice and the existing subscription', async () => {
    renderContainer(
      [
        memberPlanListQuery,
        ...userDataQueries,
        subscribeInfoQuery(standardPlan),
      ],
      {},
      true
    );

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2), {
      timeout: 10_000,
    });
    expect(
      screen.queryByRole('heading', { name: t('subscribe.spamProtection') })
    ).not.toBeInTheDocument();
  });

  it('registers, logs the reader in and subscribes with the absolute redirect pages', async () => {
    const user = userEvent.setup();
    const { setToken } = renderContainer([
      memberPlanListQuery,
      mockChallengeQuery(challenge),
      subscribeInfoQuery(standardPlan),
      ...userDataQueries,
      mockOperation(RegisterDocument, {
        variables: registerVariables,
        data: {
          __typename: 'Mutation',
          registerMember: {
            __typename: 'Registration',
            session: mockSessionWithoutUser(),
            user: mockSensitiveDataUser({
              firstName: null,
              name: 'Bar',
              email: 'foobar@email.com',
            }),
          },
        },
      }),
      mockOperation(SubscribeDocument, {
        variables: {
          ...subscribeVariables,
          successURL: redirectUrl('/abo/danke'),
          failureURL: redirectUrl('/abo/fehler'),
        },
        data: {
          __typename: 'Mutation',
          createUserSubscription: mockPayment({ state: PaymentState.Paid }),
        },
      }),
    ]);

    await fillAndSubmit(user);

    expect(await screen.findByText('logged in')).toBeInTheDocument();
    expect(setToken).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/abo/danke'))
    );
  });

  it('shows the error and does not subscribe when the registration fails', async () => {
    const user = userEvent.setup();
    const { setToken } = renderContainer([
      memberPlanListQuery,
      mockChallengeQuery(challenge),
      subscribeInfoQuery(standardPlan),
      mockOperation(RegisterDocument, {
        variables: registerVariables,
        errors: [{ message: 'Email already in use.' }],
      }),
    ]);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already in use.'
    );
    expect(setToken).not.toHaveBeenCalled();
    expect(screen.getByText('logged out')).toBeInTheDocument();
  });

  it('redirects to the fail page with the message when subscribing fails', async () => {
    const user = userEvent.setup();
    renderContainer(
      [
        memberPlanListQuery,
        ...userDataQueries,
        subscribeInfoQuery(standardPlan),
        mockOperation(SubscribeDocument, {
          variables: {
            ...subscribeVariables,
            deactivateSubscriptionId: subscription.id,
            successURL: redirectUrl('/abo/danke'),
            failureURL: redirectUrl('/abo/fehler'),
          },
          errors: [{ message: 'Card declined' }],
        }),
      ],
      { deactivateSubscriptionId: subscription.id },
      true
    );

    await user.click(await subscribeButton());

    await waitFor(() =>
      expect(window.location.href).toBe(
        `${redirectUrl('/abo/fehler')}?error=Card%20declined`
      )
    );
  });

  it('resubscribes a returning reader and sends them to the confirmation page', async () => {
    const user = userEvent.setup();
    renderContainer(
      [
        memberPlanListQuery,
        mockChallengeQuery(challenge),
        subscribeInfoQuery(standardPlan),
        mockOperation(ResubscribeDocument, {
          variables: { ...subscribeVariables, userId: 'returning-user' },
          data: {
            __typename: 'Mutation',
            createUserSubscriptionWithConfirmation: true,
          },
        }),
      ],
      { returningUserId: 'returning-user' }
    );

    await user.click(await subscribeButton());

    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/abo/bestaetigt'))
    );
  });

  it('only offers the plans the filter keeps', async () => {
    renderContainer(
      [
        memberPlanListQuery,
        mockChallengeQuery(challenge),
        subscribeInfoQuery(euroPlan),
      ],
      { filter: plans => plans.filter(plan => plan.id === euroPlan.id) }
    );

    expect(await subscribeButton(8, Currency.Eur)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(standardPlan.name, { exact: false })
    ).not.toBeInTheDocument();
  });

  it('shows the challenge error', async () => {
    renderContainer([
      memberPlanListQuery,
      subscribeInfoQuery(standardPlan),
      mockOperation(ChallengeDocument, {
        errors: [{ message: 'Something went wrong.' }],
      }),
    ]);

    expect(
      await screen.findByRole('alert', {}, { timeout: 10_000 })
    ).toHaveTextContent('Something went wrong.');
  });
});
