import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MOCK_REFERENCE_DATE,
  mockAvailablePaymentMethod,
  mockChallenge,
  mockChallengeToken,
  mockCreateSubscriptionInfo,
  mockGoodie,
  mockInvoice,
  mockMemberPlan,
  mockPaginated,
  mockPeriodicityPrice,
  mockSensitiveDataUser,
  mockSubscription,
  mockSubscriptionDeactivation,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import {
  ChallengeQuery,
  CreateSubscriptionInfoQuery,
  Currency,
  FullMemberPlanFragment,
  InvoicesQuery,
  MemberPlanListQuery,
  PaymentPeriodicity,
  ProductType,
  SubscribeBlockRenderLayout,
  SubscribePeriodicityDisplay,
  SubscriptionDeactivationReason,
  SubscriptionsQuery,
} from '@wepublish/website/api';
import {
  BuilderSubscribeSummaryProps,
  SubscribeArea,
} from '@wepublish/website/builder';
import { t } from 'i18next';
import { ComponentProps, useState } from 'react';
import { z } from 'zod';
import { formatCurrency } from '../formatters/format-currency';
import { Subscribe } from './subscribe';

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

const monthlyPaymentMethod = mockAvailablePaymentMethod({
  forceAutoRenewal: false,
  paymentPeriodicities: [PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly],
});

const monthlyForcedAutoRenewalPaymentMethod = mockAvailablePaymentMethod({
  forceAutoRenewal: true,
  paymentPeriodicities: [PaymentPeriodicity.Monthly, PaymentPeriodicity.Yearly],
});

const standardPlan = mockMemberPlan({
  name: 'Standard',
  availablePaymentMethods: [
    allPeriodicities,
    lifetimePaymentMethod,
    lifetimeForcedAutoRenewalPaymentMethod,
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
  availablePaymentMethods: [monthlyPaymentMethod],
  currency: Currency.Eur,
});

const forcedRenewalPlan = mockMemberPlan({
  name: 'Forced',
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 1200,
      amountTarget: 1200,
      amountMax: null,
    }),
  ],
  availablePaymentMethods: [monthlyForcedAutoRenewalPaymentMethod],
});

const donationPlan = mockMemberPlan({
  name: 'Donation',
  periodicityPricing: [
    mockPeriodicityPrice({ amountMin: 0, amountTarget: null, amountMax: null }),
  ],
  availablePaymentMethods: [monthlyForcedAutoRenewalPaymentMethod],
  productType: ProductType.Donation,
});

const lifetimeOnlyPlan = mockMemberPlan({
  name: 'Lifetime only',
  availablePaymentMethods: [lifetimePaymentMethod],
});

const fixedPricePlan = mockMemberPlan({
  name: 'Fixed',
  availablePaymentMethods: [monthlyPaymentMethod],
  periodicityPricing: [
    mockPeriodicityPrice({
      amountMin: 1000,
      amountTarget: null,
      amountMax: 1000,
    }),
  ],
});

const subscription = mockSubscription({
  memberPlan: standardPlan,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const openInvoice = mockInvoice({
  total: 5000,
  subscription,
  paidAt: null,
  canceledAt: null,
  description: 'Mock Invoice',
});

const challenge = mockChallenge();

type Props = ComponentProps<typeof Subscribe>;

const loaded = <TData,>(data: TData) => ({
  data,
  loading: false,
  error: undefined,
});

const idle = { data: undefined, loading: false, error: undefined };
const loading = { data: undefined, loading: true, error: undefined };

const memberPlanList = (nodes: FullMemberPlanFragment[]) =>
  loaded({
    __typename: 'Query',
    memberPlans: mockPaginated('PaginatedMemberPlans', nodes),
  } satisfies MemberPlanListQuery) as Props['memberPlans'];

const subscribeInfo = (
  info: CreateSubscriptionInfoQuery['createSubscriptionInfo']
) =>
  loaded({
    __typename: 'Query',
    createSubscriptionInfo: info,
  } satisfies CreateSubscriptionInfoQuery) as unknown as Props['subscribeInfo'];

const userSubscriptions = (
  subscriptions: SubscriptionsQuery['userSubscriptions']
) =>
  loaded({
    __typename: 'Query',
    userSubscriptions: subscriptions,
  } satisfies SubscriptionsQuery) as Props['userSubscriptions'];

const userInvoices = (invoices: InvoicesQuery['userInvoices']) =>
  loaded({
    __typename: 'Query',
    userInvoices: invoices,
  } satisfies InvoicesQuery) as Props['userInvoices'];

const solvedChallenge = loaded({
  __typename: 'Query',
  challenge,
} satisfies ChallengeQuery) as Props['challenge'];

type RenderOptions = {
  loggedIn?: boolean;
  builder?: Parameters<typeof renderWithProviders>[1]['builder'];
};

const subscribeProps = (loggedIn: boolean) => {
  const handlers = {
    onSubscribe: vi.fn(),
    onSubscribeWithRegister: vi.fn(),
    onResubscribe: vi.fn(),
    fetchSubscribeInfo: vi.fn(),
  };

  const props: Props = {
    memberPlans: memberPlanList([
      standardPlan,
      euroPlan,
      forcedRenewalPlan,
      donationPlan,
    ]),
    challenge: loggedIn ? (idle as Props['challenge']) : solvedChallenge,
    userSubscriptions:
      loggedIn ?
        userSubscriptions([subscription])
      : (idle as Props['userSubscriptions']),
    userInvoices:
      loggedIn ? userInvoices([openInvoice]) : (idle as Props['userInvoices']),
    subscribeInfo: subscribeInfo(mockCreateSubscriptionInfo()),
    ...handlers,
  };

  return { handlers, props };
};

const renderSubscribe = (
  props: Partial<Props> = {},
  { loggedIn = false, builder }: RenderOptions = {}
) => {
  const { handlers, props: baseProps } = subscribeProps(loggedIn);

  renderWithProviders(
    <Subscribe
      {...baseProps}
      {...props}
    />,
    { user: loggedIn ? mockSensitiveDataUser() : null, builder }
  );

  return { ...handlers, user: userEvent.setup() };
};

const renderLoggedIn = (
  props: Partial<Props> = {},
  options: Omit<RenderOptions, 'loggedIn'> = {}
) => renderSubscribe(props, { ...options, loggedIn: true });

const price = (amount: number, currency = Currency.Chf) =>
  formatCurrency(amount, currency);

const subscribeButton = (amount = 7, currency = Currency.Chf) =>
  screen.getByRole('button', {
    name: name => name.includes(price(amount, currency)),
  });

const field = (key: string) => screen.getByLabelText(t(key));

const fillNameAndEmail = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(field('user.form.lastName'), 'Bar');
  await user.type(field('user.form.email'), 'foobar@email.com');
};

const fillPassword = async (
  user: ReturnType<typeof userEvent.setup>,
  password = 'supersecret123',
  repeated = password
) => {
  await user.type(field('user.form.password'), password);
  await user.type(field('user.form.passwordRepeated'), repeated);
};

const fillAddress = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(field('user.form.street'), 'Musterstrasse');
  await user.type(field('user.form.houseNumber'), '1');
  await user.type(field('user.form.zipCode'), '8047');
  await user.type(field('user.form.city'), 'Zürich');
  await user.type(field('user.form.country'), 'Schweiz{enter}');
};

const submitWhenCaptchaSolved = async (
  user: ReturnType<typeof userEvent.setup>,
  amount?: number
) => {
  await screen.findByRole('group', { name: TEST_CAPTCHA_LABEL });
  await user.click(subscribeButton(amount));
};

const expectInvalid = async (keys: string[]) => {
  for (const key of keys) {
    await waitFor(() =>
      expect(field(key)).toHaveAttribute('aria-invalid', 'true')
    );
  }
};

const confirmationDialog = () =>
  screen.findByRole('dialog', {
    name: t('subscribe.warning.confirmationTitle'),
  });

const confirm = async (
  user: ReturnType<typeof userEvent.setup>,
  amount?: number
) => {
  await user.click(subscribeButton(amount));
  await confirmationDialog();
  await user.click(subscribeButton(amount));
};

const withoutMarkup = (text: string) =>
  new DOMParser().parseFromString(text, 'text/html').body.textContent ?? '';

const expectedSubscribe = {
  memberPlanId: standardPlan.id,
  paymentMethodId: allPeriodicities.paymentMethods[0].id,
  paymentPeriodicity: PaymentPeriodicity.Monthly,
  monthlyAmount: 700,
  autoRenew: true,
  discountCode: '',
  goodieId: null,
};

describe('Subscribe', () => {
  describe('areas and summary', () => {
    it('leaves hidden areas out of the DOM, captcha included', () => {
      renderSubscribe({ hiddenAreas: ['userForm', 'challenge', 'submit'] });

      expect(
        screen.queryByLabelText(t('user.form.email'))
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('group', { name: TEST_CAPTCHA_LABEL })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: name => name.includes(price(7)) })
      ).not.toBeInTheDocument();
      expect(
        screen.getByLabelText(standardPlan.name, { exact: false })
      ).toBeInTheDocument();
    });

    it('keeps the values of an area while it is hidden', async () => {
      const { props } = subscribeProps(true);
      const Harness = () => {
        const [hiddenAreas, setHiddenAreas] = useState<SubscribeArea[]>([]);

        return (
          <>
            <button onClick={() => setHiddenAreas(['discountCode'])}>
              hide
            </button>
            <button onClick={() => setHiddenAreas([])}>show</button>
            <Subscribe
              {...props}
              showDiscountCodes
              hiddenAreas={hiddenAreas}
            />
          </>
        );
      };
      renderWithProviders(<Harness />, { user: mockSensitiveDataUser() });
      const user = userEvent.setup();

      await user.type(field('subscribe.discountCode.label'), 'WELCOME');
      await user.click(screen.getByRole('button', { name: 'hide' }));

      expect(
        screen.queryByLabelText(t('subscribe.discountCode.label'))
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'show' }));

      expect(field('subscribe.discountCode.label')).toHaveValue('WELCOME');
    });

    it('hands the chosen plan and period amount to the summary slot', async () => {
      const SubscribeSummary = ({
        memberPlan,
        paymentPeriodicity,
        periodAmount,
        currency,
        validateSelection,
      }: BuilderSubscribeSummaryProps) => (
        <div data-testid="summary">
          <span>{`${memberPlan?.name} ${paymentPeriodicity} ${periodAmount} ${currency}`}</span>
          <button onClick={() => validateSelection()}>validate</button>
        </div>
      );
      const { user } = renderLoggedIn({}, { builder: { SubscribeSummary } });

      expect(screen.getByTestId('summary')).toHaveTextContent(
        `${standardPlan.name} ${PaymentPeriodicity.Monthly} 700 ${Currency.Chf}`
      );

      await user.selectOptions(
        screen.getByLabelText(t('subscribe.periodicity')),
        PaymentPeriodicity.Yearly
      );

      expect(screen.getByTestId('summary')).toHaveTextContent(
        `${standardPlan.name} ${PaymentPeriodicity.Yearly} 8400 ${Currency.Chf}`
      );
    });

    it('reports the validation errors of a failed submit', async () => {
      const onInvalid = vi.fn();
      const { user } = renderSubscribe({ onInvalid });

      await submitWhenCaptchaSolved(user);

      await waitFor(() =>
        expect(onInvalid).toHaveBeenCalledWith(
          expect.objectContaining({ email: expect.anything() })
        )
      );
    });
  });

  describe('logged out', () => {
    it('marks the required fields when submitted empty', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe();

      await user.click(subscribeButton());

      await expectInvalid([
        'user.form.firstName',
        'user.form.lastName',
        'user.form.email',
        'user.form.password',
        'user.form.street',
      ]);
      expect(onSubscribeWithRegister).not.toHaveBeenCalled();
    });

    it('registers and subscribes with everything entered, the captcha token and the transaction fee', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe({
        transactionFeeText: 'Gebühren übernehmen',
      });

      await user.type(field('user.form.firstName'), 'Foo');
      await fillNameAndEmail(user);
      await fillPassword(user);
      await fillAddress(user);
      await user.click(
        screen.getByRole('checkbox', { name: 'Gebühren übernehmen' })
      );
      await submitWhenCaptchaSolved(user, 7.15);

      await waitFor(() =>
        expect(onSubscribeWithRegister).toHaveBeenCalledWith({
          register: {
            firstName: 'Foo',
            name: 'Bar',
            email: 'foobar@email.com',
            password: 'supersecret123',
            address: {
              streetAddress: 'Musterstrasse',
              streetAddressNumber: '1',
              zipCode: '8047',
              city: 'Zürich',
              country: 'Schweiz',
            },
            challengeAnswer: {
              challengeID: challenge.challengeID,
              challengeSolution: mockChallengeToken,
            },
          },
          subscribe: { ...expectedSubscribe, monthlyAmount: 715 },
        })
      );
    });

    it('registers with name and email only when no extra fields are asked for', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe({ fields: [] });

      await fillNameAndEmail(user);
      await submitWhenCaptchaSolved(user);

      await waitFor(() =>
        expect(onSubscribeWithRegister).toHaveBeenCalledWith({
          register: {
            name: 'Bar',
            email: 'foobar@email.com',
            challengeAnswer: {
              challengeID: challenge.challengeID,
              challengeSolution: mockChallengeToken,
            },
          },
          subscribe: expectedSubscribe,
        })
      );
    });

    it.each([
      [[], ['user.form.lastName', 'user.form.email'], ['user.form.password']],
      [
        ['firstName'],
        ['user.form.firstName', 'user.form.lastName', 'user.form.email'],
        ['user.form.password', 'user.form.street'],
      ],
      [
        ['address'],
        [
          'user.form.lastName',
          'user.form.email',
          'user.form.street',
          'user.form.houseNumber',
          'user.form.zipCode',
          'user.form.city',
        ],
        ['user.form.firstName', 'user.form.password'],
      ],
      [
        ['password', 'passwordRepeated'],
        ['user.form.lastName', 'user.form.email', 'user.form.password'],
        ['user.form.firstName', 'user.form.street'],
      ],
    ] as const)(
      'with fields %j it requires %j and hides %j',
      async (fields, required, hidden) => {
        const { user, onSubscribeWithRegister } = renderSubscribe({
          fields: [...fields],
        });

        for (const key of hidden) {
          expect(screen.queryByLabelText(t(key))).not.toBeInTheDocument();
        }

        await user.click(subscribeButton());

        await expectInvalid([...required]);
        expect(onSubscribeWithRegister).not.toHaveBeenCalled();
      }
    );

    it('asks for the birthday when configured', async () => {
      renderSubscribe({ fields: ['birthday'] });

      expect(
        await screen.findByRole('group', { name: t('user.form.birthday') })
      ).toBeInTheDocument();
    });

    it('rejects passwords that do not match', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe({
        fields: ['password', 'passwordRepeated'],
      });

      await fillNameAndEmail(user);
      await fillPassword(user, 'supersecret123', 'supersecret124');
      await submitWhenCaptchaSolved(user);

      expect(
        await screen.findByText('Passwörter stimmen nicht überein.')
      ).toBeInTheDocument();
      expect(onSubscribeWithRegister).not.toHaveBeenCalled();
    });

    it('applies a custom validation schema', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe({
        fields: ['password', 'passwordRepeated'],
        schema: z.object({ password: z.string().min(16) }),
      });

      await fillNameAndEmail(user);
      await fillPassword(user);
      await submitWhenCaptchaSolved(user);

      await expectInvalid(['user.form.password']);
      expect(onSubscribeWithRegister).not.toHaveBeenCalled();
    });

    it('shows the challenge error', () => {
      renderSubscribe({
        challenge: {
          ...idle,
          error: new Error('Something went wrong.'),
        } as unknown as Props['challenge'],
      });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong.'
      );
    });

    it('disables subscribing while the challenge loads', () => {
      renderSubscribe({ challenge: loading as Props['challenge'] });

      expect(subscribeButton()).toBeDisabled();
    });

    it('shows the error when registering fails', async () => {
      const { user, onSubscribeWithRegister } = renderSubscribe({
        fields: [],
      });

      onSubscribeWithRegister.mockRejectedValue(
        new Error('Email already in use.')
      );
      await fillNameAndEmail(user);
      await submitWhenCaptchaSolved(user);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Email already in use.'
      );
    });

    it('greets a returning reader and resubscribes them without registering', async () => {
      const { user, onResubscribe, onSubscribeWithRegister } = renderSubscribe({
        returningUserId: 'returning-user',
        defaults: { firstName: 'Foo', name: 'Bar' },
      });

      expect(
        screen.getByRole('heading', {
          name: t('subscribe.greeting', { name: 'Foo Bar' }),
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(t('user.form.email'))
      ).not.toBeInTheDocument();

      await user.click(subscribeButton());

      await waitFor(() =>
        expect(onResubscribe).toHaveBeenCalledWith({
          ...expectedSubscribe,
          userId: 'returning-user',
        })
      );
      expect(onSubscribeWithRegister).not.toHaveBeenCalled();
    });
  });

  describe('logged in', () => {
    it('warns about open invoices and the existing subscription instead of asking for user data', () => {
      renderLoggedIn();

      const alerts = screen.getAllByRole('alert');

      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent(
        withoutMarkup(t('subscribe.warning.openInvoices'))
      );
      expect(alerts[1]).toHaveTextContent(
        withoutMarkup(t('subscribe.warning.alreadyHasSubscription'))
      );
      expect(
        screen.queryByLabelText(t('user.form.email'))
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: t('subscribe.spamProtection') })
      ).not.toBeInTheDocument();
    });

    it('asks for confirmation with links to the profile before subscribing', async () => {
      const { user, onSubscribe } = renderLoggedIn();

      await user.click(subscribeButton());

      await confirmationDialog();

      expect(
        screen.getAllByRole('link').map(link => link.getAttribute('href'))
      ).toEqual(['/profile', '/profile']);
      expect(onSubscribe).not.toHaveBeenCalled();
    });

    it('subscribes after the reader confirms the warning', async () => {
      const { user, onSubscribe } = renderLoggedIn();

      await confirm(user);

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith(expectedSubscribe)
      );
    });

    it('does not subscribe when the reader cancels the warning', async () => {
      const { user, onSubscribe } = renderLoggedIn();

      await user.click(subscribeButton());
      await confirmationDialog();
      await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', {
            name: t('subscribe.warning.confirmationTitle'),
          })
        ).not.toBeInTheDocument()
      );
      expect(onSubscribe).not.toHaveBeenCalled();
    });

    it('subscribes without a warning when it replaces a subscription', async () => {
      const { user, onSubscribe } = renderLoggedIn({
        deactivateSubscriptionId: subscription.id,
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await user.click(subscribeButton());

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith(expectedSubscribe)
      );
    });

    it('switches to the payment method of a newly chosen plan and forces auto renewal', async () => {
      const { user, onSubscribe } = renderLoggedIn();

      await user.click(
        screen.getByLabelText(forcedRenewalPlan.name, { exact: false })
      );

      expect(
        screen.queryByRole('checkbox', { name: 'Automatisch erneuern' })
      ).not.toBeInTheDocument();

      await confirm(user, 12);

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith({
          ...expectedSubscribe,
          memberPlanId: forcedRenewalPlan.id,
          paymentMethodId:
            monthlyForcedAutoRenewalPaymentMethod.paymentMethods[0].id,
          monthlyAmount: 1200,
          autoRenew: true,
        })
      );
    });

    it('only offers the payment methods of the chosen periodicity', async () => {
      const { user, onSubscribe } = renderLoggedIn();
      const paymentMethod =
        lifetimeForcedAutoRenewalPaymentMethod.paymentMethods[0];

      expect(
        screen.queryByRole('radio', {
          name: `${paymentMethod.description} ${paymentMethod.name}`,
        })
      ).not.toBeInTheDocument();

      await user.selectOptions(
        screen.getByLabelText(t('subscribe.periodicity')),
        PaymentPeriodicity.Lifetime
      );
      await user.click(
        screen.getByRole('radio', {
          name: `${paymentMethod.description} ${paymentMethod.name}`,
        })
      );
      await confirm(user, 8400);

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith({
          ...expectedSubscribe,
          paymentPeriodicity: PaymentPeriodicity.Lifetime,
          paymentMethodId: paymentMethod.id,
          autoRenew: true,
        })
      );
    });

    it('only offers the goodies of the chosen periodicity', async () => {
      const booklet = mockGoodie({
        name: 'NLA Booklet',
        paymentPeriodicities: [PaymentPeriodicity.Biennial],
      });
      const mug = mockGoodie({ name: 'Coffee mug' });
      const planWithGoodies = mockMemberPlan({
        name: 'With goodies',
        availablePaymentMethods: [allPeriodicities],
        goodies: [booklet, mug],
      });
      const { user } = renderLoggedIn({
        memberPlans: memberPlanList([planWithGoodies]),
        showGoodies: true,
      });

      expect(
        screen.getByRole('radio', { name: /Coffee mug/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('radio', { name: /NLA Booklet/ })
      ).not.toBeInTheDocument();

      await user.selectOptions(
        screen.getByLabelText(t('subscribe.periodicity')),
        PaymentPeriodicity.Biennial
      );

      expect(
        screen.getByRole('radio', { name: /NLA Booklet/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /Coffee mug/ })
      ).toBeInTheDocument();
    });

    it('renews automatically by default when the plans arrive after the first render', async () => {
      const user = userEvent.setup();
      const onSubscribe = vi.fn();
      const ui = (memberPlans: Props['memberPlans']) => (
        <Subscribe
          memberPlans={memberPlans}
          challenge={idle as Props['challenge']}
          userSubscriptions={userSubscriptions([])}
          userInvoices={userInvoices([])}
          subscribeInfo={subscribeInfo(mockCreateSubscriptionInfo())}
          fetchSubscribeInfo={vi.fn()}
          onSubscribe={onSubscribe}
          onSubscribeWithRegister={vi.fn()}
        />
      );
      const { rerender } = renderWithProviders(
        ui(loading as Props['memberPlans']),
        { user: mockSensitiveDataUser() }
      );

      rerender(ui(memberPlanList([standardPlan])));

      expect(
        await screen.findByRole('checkbox', { name: 'Automatisch erneuern' })
      ).toBeChecked();

      await user.click(subscribeButton());

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith(expectedSubscribe)
      );
    });

    it('never renews a plan that cannot be extended', async () => {
      const oneOffPlan = mockMemberPlan({
        name: 'One-off',
        extendable: false,
        availablePaymentMethods: [monthlyPaymentMethod],
      });
      const { user, onSubscribe } = renderLoggedIn({
        memberPlans: memberPlanList([oneOffPlan]),
        deactivateSubscriptionId: subscription.id,
      });

      expect(
        screen.queryByRole('checkbox', { name: 'Automatisch erneuern' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(t('subscribe.cancellable'))
      ).not.toBeInTheDocument();

      await user.click(subscribeButton());

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith({
          ...expectedSubscribe,
          memberPlanId: oneOffPlan.id,
          paymentMethodId: monthlyPaymentMethod.paymentMethods[0].id,
          autoRenew: false,
        })
      );
    });

    it('subscribes without auto renewal when the reader opts out', async () => {
      const { user, onSubscribe } = renderLoggedIn({
        deactivateSubscriptionId: subscription.id,
      });

      await user.click(
        screen.getByRole('checkbox', { name: 'Automatisch erneuern' })
      );

      expect(
        screen.queryByText(t('subscribe.cancellable'))
      ).not.toBeInTheDocument();

      await user.click(subscribeButton());

      await waitFor(() =>
        expect(onSubscribe).toHaveBeenCalledWith({
          ...expectedSubscribe,
          autoRenew: false,
        })
      );
    });

    it.each([
      ['subscriptions', { userSubscriptions: loading }],
      ['invoices', { userInvoices: loading }],
    ])('disables subscribing while the %s load', (_, props) => {
      renderLoggedIn(props as Partial<Props>);

      expect(subscribeButton()).toBeDisabled();
    });

    it('shows the error when subscribing fails', async () => {
      const { user, onSubscribe } = renderLoggedIn();

      onSubscribe.mockRejectedValue(new Error('Something went wrong.'));
      await confirm(user);

      await waitFor(() =>
        expect(
          screen
            .getAllByRole('alert')
            .some(alert => alert.textContent?.includes('Something went wrong.'))
        ).toBe(true)
      );
    });

    it('keeps a plan without monthly payments selectable and purchasable', () => {
      renderLoggedIn({
        memberPlans: memberPlanList([lifetimeOnlyPlan, standardPlan]),
      });

      expect(
        screen.getByLabelText(lifetimeOnlyPlan.name, { exact: false })
      ).toBeEnabled();
      expect(
        screen.getByLabelText(lifetimeOnlyPlan.name, { exact: false })
      ).toBeChecked();
      expect(subscribeButton(8400)).toBeEnabled();
    });

    const pickerWithInput = (memberPlanId: string) => [
      {
        __typename: 'SubscribeBlockMemberPlanRenderSetting' as const,
        memberPlanId,
        isDefault: true,
        layout: {
          __typename: 'SubscribeBlockLayoutPickerConfig' as const,
          type: SubscribeBlockRenderLayout.Picker,
          showInput: true,
          values: [],
          valuesByPeriodicity: [],
        },
      },
    ];

    it('lets the reader choose the amount for a plan with a price range', () => {
      renderLoggedIn({
        periodicityDisplay: SubscribePeriodicityDisplay.Toggle,
        memberPlans: memberPlanList([standardPlan]),
        memberPlanRenderSettings: pickerWithInput(standardPlan.id),
      });

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('offers no amount choice for a fixed price', () => {
      renderLoggedIn({
        periodicityDisplay: SubscribePeriodicityDisplay.Toggle,
        memberPlans: memberPlanList([fixedPricePlan]),
        memberPlanRenderSettings: pickerWithInput(fixedPricePlan.id),
      });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(subscribeButton(10)).toBeInTheDocument();
    });

    it('only warns about open invoices when the existing subscription is deactivated', () => {
      renderLoggedIn({
        userSubscriptions: userSubscriptions([
          {
            ...subscription,
            deactivation: mockSubscriptionDeactivation({
              date: MOCK_REFERENCE_DATE,
              reason: SubscriptionDeactivationReason.None,
            }),
          },
        ]),
      });

      const alerts = screen.getAllByRole('alert');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent(
        withoutMarkup(t('subscribe.warning.openInvoices'))
      );
    });

    it('only warns about the subscription when every invoice is paid or canceled', () => {
      renderLoggedIn({
        userInvoices: userInvoices([
          { ...openInvoice, paidAt: MOCK_REFERENCE_DATE },
          { ...openInvoice, canceledAt: MOCK_REFERENCE_DATE },
        ]),
      });

      const alerts = screen.getAllByRole('alert');

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent(
        withoutMarkup(t('subscribe.warning.alreadyHasSubscription'))
      );
    });

    it('shows the price in the currency of the plan given by its slug', () => {
      renderLoggedIn({ defaults: { memberPlanSlug: euroPlan.slug } });

      expect(
        screen.getByLabelText(euroPlan.name, { exact: false })
      ).toBeChecked();
      expect(subscribeButton(8, Currency.Eur)).toBeInTheDocument();
    });

    it('offers to donate for a donation plan', () => {
      renderLoggedIn({ defaults: { memberPlanSlug: donationPlan.slug } });

      expect(
        screen.getByRole('button', {
          name: t('subscribe.button.subscribeForPeriod', {
            monthlyAmount: 0,
            productType: ProductType.Donation,
          }),
        })
      ).toBeInTheDocument();
    });

    it('fetches the subscription info for the plan and the entered discount code', async () => {
      const { user, fetchSubscribeInfo } = renderLoggedIn({
        showDiscountCodes: true,
      });

      expect(fetchSubscribeInfo).toHaveBeenCalledWith({
        variables: { memberPlanId: standardPlan.id, discountCode: '' },
      });

      await user.type(
        screen.getByLabelText(t('subscribe.discountCode.label')),
        'SAVE'
      );

      expect(fetchSubscribeInfo).toHaveBeenLastCalledWith({
        variables: { memberPlanId: standardPlan.id, discountCode: 'SAVE' },
      });
    });

    it('charges the discounted first period and tells the full price after', () => {
      renderLoggedIn({
        showDiscountCodes: true,
        subscribeInfo: subscribeInfo(
          mockCreateSubscriptionInfo({
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
      expect(subscribeButton(5.6)).toBeInTheDocument();
      expect(
        screen.getByText(
          t('subscribe.continuation', {
            afterFirstPaymentPeriod: t(
              'subscription.afterFirstPaymentPeriod.monthly'
            ).toLowerCase(),
            renewalPeriodL: t(
              'subscription.renewalPeriod.monthly'
            ).toLowerCase(),
            formattedAmount: price(7),
          })
        )
      ).toBeInTheDocument();
    });

    it('marks an invalid discount code and does not subscribe', async () => {
      const { user, onSubscribe } = renderLoggedIn({
        showDiscountCodes: true,
        subscribeInfo: subscribeInfo(
          mockCreateSubscriptionInfo({
            discountPercent: null,
            discountCodeValid: false,
          })
        ),
      });

      expect(
        screen.getByText(t('subscribe.discountCode.invalid'))
      ).toBeInTheDocument();

      await confirm(user);

      expect(onSubscribe).not.toHaveBeenCalled();
    });

    it('offers to donate with the discount applied', () => {
      renderLoggedIn({
        showDiscountCodes: true,
        defaults: { memberPlanSlug: donationPlan.slug },
        subscribeInfo: subscribeInfo(
          mockCreateSubscriptionInfo({
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
      expect(
        screen.getByRole('button', {
          name: t('subscribe.button.subscribeForPeriod', {
            monthlyAmount: 0,
            productType: ProductType.Donation,
          }),
        })
      ).toBeInTheDocument();
    });
  });
});
