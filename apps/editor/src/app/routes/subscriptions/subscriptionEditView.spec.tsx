import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type FullMemberPlanFragment,
  type FullPaymentMethodFragment,
  type FullSubscriptionFragment,
  type InvoicesQuery,
  type PaymentMethodListQuery,
  type SubscriptionQuery,
  type UserQuery,
  ActionMailNoMailReason,
  CancelSubscriptionDocument,
  CreateSubscriptionDocument,
  Currency,
  InvoicesDocument,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  ReactivateSubscriptionDocument,
  RenewSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionCancellationMailDocument,
  SubscriptionCreationMailDocument,
  SubscriptionDeactivationReason,
  SubscriptionDocument,
  UpdateSubscriptionDocument,
  UserDocument,
} from '@wepublish/editor/api';
import {
  getFieldByLabel,
  memberPlanFixture,
  memberPlanListMock,
  queryFieldByLabel,
  renderFormRoutes,
  userFixture,
  userListMock,
} from '@wepublish/form/editor/testing';
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { SubscriptionEditView } from './subscriptionEditView';

type Mock = MockLink.MockedResponse;

const timestamp = '2026-01-02T10:00:00.000Z';

const yearlyPlan: FullMemberPlanFragment = {
  ...memberPlanFixture('plan-1', 'Jahresabo'),
  extendable: true,
};

const trialPlan: FullMemberPlanFragment = {
  ...memberPlanFixture('plan-trial', 'Probeabo'),
  extendable: false,
  maxCount: 1,
  periodicityPricing: [
    {
      __typename: 'PeriodicityPrice',
      periodicity: PaymentPeriodicity.Yearly,
      label: null,
      amountMin: 2400,
      amountTarget: null,
      amountMax: null,
    },
  ],
};

const paymentMethod = (
  id: string,
  name: string
): FullPaymentMethodFragment => ({
  __typename: 'PaymentMethod',
  id,
  name,
  slug: id,
  createdAt: timestamp,
  modifiedAt: timestamp,
  gracePeriod: 0,
  description: '',
  active: true,
  paymentProvider: null,
  image: null,
});

const creditCard = paymentMethod('payment-method-1', 'Kreditkarte');
const invoice = paymentMethod('payment-method-2', 'Rechnung');

const member = userFixture('user-1', 'Max', 'Muster', 'max@test.ch');

type Loaded = SubscriptionQuery['subscription'];

const subscriptionFixture = (overrides: Partial<Loaded> = {}): Loaded => ({
  __typename: 'PublicSubscription',
  id: 'subscription-1',
  createdAt: timestamp,
  modifiedAt: timestamp,
  confirmed: true,
  user: {
    __typename: 'User',
    id: member.id,
    name: member.name,
    firstName: member.firstName,
  },
  memberPlan: yearlyPlan,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  monthlyAmount: 500,
  autoRenew: true,
  startsAt: timestamp,
  paidUntil: '2027-01-02T10:00:00.000Z',
  properties: [
    { __typename: 'Property', key: 'source', value: 'web', public: false },
  ],
  paymentMethod: creditCard,
  deactivation: null,
  extendable: true,
  canRevertUpgrade: false,
  currency: Currency.Chf,
  goodie: null,
  pendingPaymentMethodChange: null,
  periods: [],
  ...overrides,
});

const pastDeactivation = {
  __typename: 'SubscriptionDeactivation' as const,
  date: '2026-02-01T10:00:00.000Z',
  reason: SubscriptionDeactivationReason.None,
};

const anyVariables = () => true;

const sent = {
  update: vi.fn(),
  create: vi.fn(),
  cancel: vi.fn(),
  reactivate: vi.fn(),
  revert: vi.fn(),
  renew: vi.fn(),
};

const subscriptionMock = (subscription: Loaded): Mock => ({
  request: { query: SubscriptionDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: SubscriptionQuery = { __typename: 'Query', subscription };

    return { data };
  },
});

const invoicesMock: Mock = {
  request: { query: InvoicesDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: InvoicesQuery = {
      __typename: 'Query',
      invoices: {
        __typename: 'InvoiceConnection',
        totalCount: 0,
        nodes: [],
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    return { data };
  },
};

const paymentMethodsMock: Mock = {
  request: { query: PaymentMethodListDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: PaymentMethodListQuery = {
      __typename: 'Query',
      paymentMethods: [creditCard, invoice],
    };

    return { data };
  },
};

const userMock: Mock = {
  request: { query: UserDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: UserQuery = { __typename: 'Query', user: member };

    return { data };
  },
};

const actionMail = {
  __typename: 'ActionMail' as const,
  event: 'SUBSCRIBE',
  recipientEmail: 'max@test.ch',
  mailTemplateId: null,
  mailTemplateName: null,
  noMailReason: ActionMailNoMailReason.NoTemplate,
};

const creationMailMock: Mock = {
  request: { query: SubscriptionCreationMailDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => ({
    data: { __typename: 'Query', subscriptionCreationMail: actionMail },
  }),
};

const cancellationMailMock: Mock = {
  request: {
    query: SubscriptionCancellationMailDocument,
    variables: anyVariables,
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => ({
    data: { __typename: 'Query', subscriptionCancellationMail: actionMail },
  }),
};

const mutationMock = (
  query: Mock['request']['query'],
  field: string,
  record: (variables: Record<string, unknown>) => void,
  subscription: Loaded
): Mock => ({
  request: { query, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: Record<string, unknown>) => {
    record(JSON.parse(JSON.stringify(variables)));

    return {
      data: {
        __typename: 'Mutation',
        [field]: subscription as FullSubscriptionFragment,
      },
    };
  },
});

const mocksFor = (subscription: Loaded) => [
  subscriptionMock(subscription),
  invoicesMock,
  paymentMethodsMock,
  userMock,
  creationMailMock,
  cancellationMailMock,
  memberPlanListMock([yearlyPlan, trialPlan]),
  userListMock([member]),
  mutationMock(
    UpdateSubscriptionDocument,
    'updateSubscription',
    sent.update,
    subscription
  ),
  mutationMock(CreateSubscriptionDocument, 'createSubscription', sent.create, {
    ...subscription,
    id: 'subscription-new',
  }),
  mutationMock(
    CancelSubscriptionDocument,
    'cancelSubscription',
    sent.cancel,
    subscription
  ),
  mutationMock(
    ReactivateSubscriptionDocument,
    'reactivateSubscription',
    sent.reactivate,
    subscription
  ),
  mutationMock(
    RevertSubscriptionUpgradeDocument,
    'revertSubscriptionUpgrade',
    sent.revert,
    subscription
  ),
  mutationMock(
    RenewSubscriptionDocument,
    'renewSubscription',
    sent.renew,
    subscription
  ),
];

const permissions = [
  CanGetSubscription,
  CanGetSubscriptions,
  CanCreateSubscription,
  CanCancelSubscription,
];

const admin: AuthContextState = {
  session: {
    email: 'admin@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'admin',
        name: 'admin',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

function Admin({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={admin}>{children}</AuthContext.Provider>;
}

const renderSubscription = (
  route: string,
  subscription: Loaded = subscriptionFixture()
) =>
  renderFormRoutes(
    {
      '/subscriptions/create': <SubscriptionEditView />,
      '/subscriptions/edit/:id': <SubscriptionEditView />,
    },
    { route, wrapper: Admin, mocks: mocksFor(subscription) }
  );

const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');

const loadedVariables = {
  id: 'subscription-1',
  monthlyAmount: 500,
  paymentPeriodicity: 'yearly',
  autoRenew: true,
  startsAt: timestamp,
  properties: [{ key: 'source', value: 'web', public: false }],
  extendable: true,
  userID: 'user-1',
  paymentMethodID: 'payment-method-1',
  memberPlanID: 'plan-1',
};

const loaded = () =>
  screen.findByText('userSubscriptionEdit.deactivation.title.activated');

const userField = () => getFieldByLabel(/^userSubscriptionEdit\.selectUser/);
const memberPlanField = () =>
  getFieldByLabel(/^userSubscriptionEdit\.selectMemberPlan/);
const paymentMethodField = () =>
  getFieldByLabel(/^userSubscriptionEdit\.paymentMethod/);
const periodAmount = () =>
  getFieldByLabel(/^userSubscriptionEdit\.periodAmount/);

const pick = async (user: UserEvent, input: HTMLElement, name: string) => {
  await user.click(input);
  await user.click(await screen.findByRole('option', { name }));
};

const typeAmount = async (user: UserEvent, amount: string) => {
  await user.clear(periodAmount());
  await user.type(periodAmount(), amount);
};

beforeEach(() => {
  Object.values(sent).forEach(mock => mock.mockClear());
});

describe('SubscriptionEditView', () => {
  it('saves the loaded subscription with unchanged variables and stays', async () => {
    const { user, currentPath } = renderSubscription(
      '/subscriptions/edit/subscription-1'
    );

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent.update).toHaveBeenCalledTimes(1));
    expect(sent.update.mock.calls[0][0]).toStrictEqual(loadedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/subscriptions/edit/subscription-1');
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderSubscription(
      '/subscriptions/edit/subscription-1'
    );

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(currentPath()).toBe('/subscriptions'));
    expect(sent.update).toHaveBeenCalledTimes(1);
  });

  it('goes back to the member after save and close when it came from there', async () => {
    const { user, currentPath } = renderSubscription(
      '/subscriptions/edit/subscription-1?userId=user-1'
    );

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(currentPath()).toBe('/users/edit/user-1'));
  });

  it('is read-only once it is deactivated', async () => {
    renderSubscription(
      '/subscriptions/edit/subscription-1',
      subscriptionFixture({ deactivation: pastDeactivation })
    );

    expect(
      await screen.findByText(
        'userSubscriptionEdit.reactivation.deactivatedSince'
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('form.view.readOnly')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).toBeNull();
    await waitFor(() => expect(periodAmount()).toBeDisabled());
    expect(memberPlanField()).toBeDisabled();
    expect(
      screen.queryByText('userSubscriptionEdit.deactivation.title.activated')
    ).toBeNull();
  });

  it('shows a payment method change the reader has not finished yet', async () => {
    renderSubscription(
      '/subscriptions/edit/subscription-1',
      subscriptionFixture({
        pendingPaymentMethodChange: {
          __typename: 'SubscriptionPaymentMethodChange',
          id: 'change-1',
          kind: PaymentMethodChangeKind.InvoicePayment,
          state: PaymentMethodChangeState.Pending,
          createdAt: timestamp,
          expiresAt: '2026-11-04T10:00:00.000Z',
          paymentMethod: {
            __typename: 'PaymentMethod',
            id: 'payment-method-2',
            name: 'TWINT',
          },
        },
      })
    );

    expect(
      await screen.findByText(
        'userSubscriptionEdit.paymentMethodChange.pending'
      )
    ).toBeInTheDocument();
  });

  it('offers no reactivation or upgrade revert for a running subscription', async () => {
    renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();

    expect(screen.queryByTestId('reactivateSubscription')).toBeNull();
    expect(screen.queryByTestId('revertSubscriptionUpgrade')).toBeNull();
    expect(
      screen.queryByText('userSubscriptionEdit.paymentMethodChange.pending')
    ).toBeNull();
  });

  it('reactivates a deactivated subscription after confirmation', async () => {
    const { user } = renderSubscription(
      '/subscriptions/edit/subscription-1',
      subscriptionFixture({ deactivation: pastDeactivation })
    );

    await user.click(await screen.findByTestId('reactivateSubscription'));

    expect(sent.reactivate).not.toHaveBeenCalled();

    await user.click(
      await screen.findByText('userSubscriptionEdit.reactivation.confirm')
    );

    await waitFor(() =>
      expect(sent.reactivate).toHaveBeenCalledWith({ id: 'subscription-1' })
    );
  });

  it('reverts an unpaid upgrade after confirmation', async () => {
    const { user } = renderSubscription(
      '/subscriptions/edit/subscription-1',
      subscriptionFixture({
        canRevertUpgrade: true,
        deactivation: {
          ...pastDeactivation,
          reason: SubscriptionDeactivationReason.UserReplacedSubscription,
        },
      })
    );

    await user.click(await screen.findByTestId('revertSubscriptionUpgrade'));

    expect(sent.revert).not.toHaveBeenCalled();
    expect(screen.queryByTestId('reactivateSubscription')).toBeNull();

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'userSubscriptionEdit.revertUpgrade.confirm',
      })
    );

    await waitFor(() =>
      expect(sent.revert).toHaveBeenCalledWith({ id: 'subscription-1' })
    );
  });

  it('renews an extendable subscription after confirmation', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();
    await user.click(
      await screen.findByRole('button', {
        name: 'userSubscriptionEdit.renewNow',
      })
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'userSubscriptionEdit.renewNow',
      })
    );

    await waitFor(() =>
      expect(sent.renew).toHaveBeenCalledWith({ id: 'subscription-1' })
    );
  });

  it('turns off auto renew when the subscription stops being extendable', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();

    const autoRenew = await screen.findByRole('checkbox', {
      name: /^userSubscriptionEdit\.autoRenew/,
    });

    expect(autoRenew).toBeChecked();

    await user.click(
      screen.getByRole('checkbox', {
        name: /^memberplanForm\.extendableToggle/,
      })
    );

    expect(
      screen.queryByRole('checkbox', {
        name: /^userSubscriptionEdit\.autoRenew/,
      })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'userSubscriptionEdit.renewNow' })
    ).toBeNull();

    await user.click(save());

    await waitFor(() => expect(sent.update).toHaveBeenCalledTimes(1));
    expect(sent.update.mock.calls[0][0]).toStrictEqual({
      ...loadedVariables,
      extendable: false,
      autoRenew: false,
    });
  });

  it('shows the loaded subscription in its sections', async () => {
    renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();

    await waitFor(() => expect(userField()).toHaveValue('Max Muster '));
    expect(memberPlanField()).toHaveValue('Jahresabo');
    expect(paymentMethodField()).toHaveValue('Kreditkarte');
    expect(periodAmount()).toHaveValue('60.00');
    expect(
      screen.getByRole('region', { name: 'subscriptionEditView.detailsTitle' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'subscriptionEditView.renewalTitle' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'invoice.panel.invoiceHistory' })
    ).toBeInTheDocument();
  });

  it('saves a new amount per payment interval as a monthly amount', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();
    await typeAmount(user, '120');
    await user.click(save());

    await waitFor(() => expect(sent.update).toHaveBeenCalledTimes(1));
    expect(sent.update.mock.calls[0][0]).toStrictEqual({
      ...loadedVariables,
      monthlyAmount: 1000,
    });
  });

  it('takes over the price and renewal of a newly picked plan', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();
    await pick(user, memberPlanField(), 'Probeabo');

    await waitFor(() => expect(periodAmount()).toHaveValue('24.00'));
    expect(
      await screen.findByText('subscriptionEditView.extendableWasChanged')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: /^memberplanForm\.extendableToggle/,
      })
    ).not.toBeChecked();
    expect(
      screen.getByText('subscriptionEditView.trialSubscriptionConfigured')
    ).toBeInTheDocument();

    await user.click(save());

    await waitFor(() => expect(sent.update).toHaveBeenCalledTimes(1));
    expect(sent.update.mock.calls[0][0]).toStrictEqual({
      ...loadedVariables,
      memberPlanID: 'plan-trial',
      monthlyAmount: 200,
      extendable: false,
      autoRenew: false,
    });
  });

  it('refuses an amount below the minimum of the plan', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await loaded();
    await pick(user, memberPlanField(), 'Probeabo');
    await typeAmount(user, '10');
    await user.click(save());

    expect(
      await screen.findByText('errorMessages.amountTooLowErrorMessage')
    ).toBeInTheDocument();
    expect(sent.update).not.toHaveBeenCalled();
  });

  it('creates a subscription for the member it came from, after the mail question', async () => {
    const { user, currentPath } = renderSubscription(
      '/subscriptions/create?userId=user-1'
    );

    await waitFor(() =>
      expect(userField()).toHaveValue('Max Muster | max@test.ch ')
    );
    expect(periodAmount()).toBeDisabled();
    expect(queryFieldByLabel(/^userSubscriptionEdit\.paidUntil/)).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'invoice.panel.invoiceHistory' })
    ).toBeNull();

    await pick(user, memberPlanField(), 'Jahresabo');
    await pick(user, paymentMethodField(), 'Rechnung');
    await typeAmount(user, '120');
    await user.click(save());

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'ok',
      })
    );

    await waitFor(() =>
      expect(currentPath()).toBe('/subscriptions/edit/subscription-new')
    );
    expect(sent.create.mock.calls[0][0]).toStrictEqual({
      monthlyAmount: 1000,
      paymentPeriodicity: 'yearly',
      autoRenew: false,
      startsAt: expect.any(String),
      properties: [],
      extendable: true,
      userID: 'user-1',
      paymentMethodID: 'payment-method-2',
      memberPlanID: 'plan-1',
      skipMail: false,
    });
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('creates nothing when the mail question is cancelled', async () => {
    const { user, currentPath } = renderSubscription(
      '/subscriptions/create?userId=user-1'
    );

    await waitFor(() =>
      expect(userField()).toHaveValue('Max Muster | max@test.ch ')
    );
    await pick(user, memberPlanField(), 'Jahresabo');
    await pick(user, paymentMethodField(), 'Rechnung');
    await user.click(save());
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(save()).toBeEnabled());
    expect(sent.create).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/subscriptions/create');
    expect(screen.queryByText('toast.createdSuccess')).toBeNull();
  });

  it('asks for a member, a plan and a payment method', async () => {
    const { user } = renderSubscription('/subscriptions/create');

    await user.click(save());

    await waitFor(() =>
      expect(screen.getAllByText('form.errors.required')).toHaveLength(3)
    );
    expect(sent.create).not.toHaveBeenCalled();
  });

  it('deactivates the subscription after the mail question', async () => {
    const { user } = renderSubscription('/subscriptions/edit/subscription-1');

    await user.click(await loaded());

    const panel = within(await screen.findByRole('dialog'));

    await user.click(panel.getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', {
        name: 'userSubscriptionEdit.deactivation.reasonNone',
      })
    );
    await user.click(
      panel.getByRole('button', {
        name: 'userSubscriptionEdit.deactivation.action.activated',
      })
    );
    await user.click(
      within(
        await screen.findByRole('dialog', { name: 'actionMail.noMailTitle' })
      ).getByRole('button', { name: 'ok' })
    );

    await waitFor(() =>
      expect(sent.cancel).toHaveBeenCalledWith({
        cancelSubscriptionId: 'subscription-1',
        reason: 'none',
        skipMail: false,
      })
    );
  });
});
