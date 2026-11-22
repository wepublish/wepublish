import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionDocument,
} from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { SubscriptionEditView } from './subscriptionEditView';

const { mutationFor, queryStore } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    queryStore: new Map<unknown, unknown>(),
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(
          document,
          vi.fn(async () => ({ data: {} }))
        );
      }

      return mutations.get(document) as Mock;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({
    query: async ({ query }: { query: unknown }) => ({
      data: (queryStore.get(query) as { data?: unknown })?.data,
    }),
  }),
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const enabledFeatures = new Set<string>();

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (feature: string) => enabledFeatures.has(feature),
  // The permission wrappers would otherwise need an authenticated session.
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: React.ReactNode }) => children,
  useAuthorisation: () => true,
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;

const memberPlan = {
  id: 'plan-1',
  name: 'Yearly',
  slug: 'yearly',
  active: true,
  currency: 'CHF',
  extendable: true,
  tags: [],
  periodicityPricing: [],
  availablePaymentMethods: [],
};

const lifelongPlan = {
  ...memberPlan,
  id: 'plan-lifelong',
  name: 'Lifelong',
  slug: 'lifelong',
  periodicityPricing: [{ periodicity: 'lifetime', amountMin: 0 }],
  defaultPaymentPeriodicity: null,
};

const monthlyOrYearlyPlan = {
  ...memberPlan,
  id: 'plan-monthly-or-yearly',
  name: 'Monthly or yearly',
  slug: 'monthly-or-yearly',
  periodicityPricing: [
    { periodicity: 'yearly', amountMin: 12000 },
    { periodicity: 'monthly', amountMin: 1100 },
  ],
  defaultPaymentPeriodicity: 'monthly',
};

const paymentMethod = {
  id: 'payment-method-1',
  name: 'Credit Card',
  slug: 'credit-card',
  active: true,
  gracePeriod: 0,
};

const subscription = (
  deactivation: unknown,
  canRevertUpgrade = false,
  pendingPaymentMethodChange: unknown = null,
  imported: { importedAt?: string | null; legacy?: boolean } = {}
) => ({
  importedAt: null,
  legacy: false,
  ...imported,
  canRevertUpgrade,
  pendingPaymentMethodChange,
  id: 'subscription-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  confirmed: true,
  user: {
    id: 'user-1',
    name: 'Muster',
    firstName: 'Max',
    email: 'max@test.ch',
  },
  memberPlan,
  paymentPeriodicity: 'yearly',
  monthlyAmount: 500,
  autoRenew: true,
  startsAt: '2026-01-02T10:00:00.000Z',
  paidUntil: '2027-01-02T10:00:00.000Z',
  properties: [],
  paymentMethod,
  deactivation,
  extendable: true,
  currency: 'CHF',
  goodie: null,
  periods: [],
});

const mockQueries = (
  deactivation: unknown,
  canRevertUpgrade = false,
  pendingPaymentMethodChange: unknown = null,
  subscriptionOverrides: Record<string, unknown> = {}
) => {
  // The results have to be referentially stable, the view reacts to them in effects.
  const refetch = vi.fn();
  const results = new Map<unknown, unknown>([
    [
      SubscriptionDocument,
      {
        loading: false,
        refetch,
        data: {
          subscription: {
            ...subscription(
              deactivation,
              canRevertUpgrade,
              pendingPaymentMethodChange
            ),
            ...subscriptionOverrides,
          },
        },
      },
    ],
    [
      InvoicesDocument,
      { loading: false, refetch, data: { invoices: { nodes: [] } } },
    ],
    [
      MemberPlanListDocument,
      {
        loading: false,
        refetch,
        data: {
          memberPlans: {
            nodes: [memberPlan, lifelongPlan, monthlyOrYearlyPlan],
          },
        },
      },
    ],
    [
      PaymentMethodListDocument,
      { loading: false, refetch, data: { paymentMethods: [paymentMethod] } },
    ],
  ]);
  const fallback = { loading: false, refetch, data: undefined };

  queryStore.clear();
  results.forEach((result, document) => queryStore.set(document, result));

  mockedUseQuery.mockImplementation(
    (document: unknown) => results.get(document) ?? fallback
  );
};

const theme = createTheme({ cssVariables: true });

const renderEditView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/subscriptions/edit/subscription-1']}>
        <Routes>
          <Route
            path="/subscriptions/edit/:id"
            element={<SubscriptionEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const renderCreateView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/subscriptions/create']}>
        <Routes>
          <Route
            path="/subscriptions/create"
            element={<SubscriptionEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

const periodicityPicker = () =>
  screen.getByRole('combobox', {
    name: /^memberPlanList.paymentPeriodicities/,
  });

const choosePlan = (name: string) => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', {
      name: /^userSubscriptionEdit.selectMemberPlan/,
    })
  );
  fireEvent.click(screen.getByRole('option', { name }));
};

const offeredPeriodicities = () => {
  fireEvent.mouseDown(periodicityPicker());

  return within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map(option => option.textContent);
};

beforeEach(() => {
  mockedUseQuery.mockReset();
  mutationFor(ReactivateSubscriptionDocument).mockClear();
  mutationFor(RevertSubscriptionUpgradeDocument).mockClear();
});

describe('SubscriptionEditView', () => {
  it('turns off auto renew when the subscription stops being extendable', async () => {
    mockQueries(null);
    renderEditView();

    const autoRenew = await screen.findByRole('checkbox', {
      name: 'userSubscriptionEdit.autoRenew',
    });
    expect(autoRenew).toBeChecked();

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'memberplanForm.extendableToggle' })
    );

    expect(
      screen.queryByRole('checkbox', {
        name: 'userSubscriptionEdit.autoRenew',
      })
    ).toBeNull();
    expect(screen.queryByText('userSubscriptionEdit.renewNow')).toBeNull();
  });

  it('shows a payment method change the reader has not finished yet', async () => {
    mockQueries(null, false, {
      id: 'change-1',
      kind: 'invoicePayment',
      state: 'pending',
      expiresAt: '2026-11-04T10:00:00.000Z',
      paymentMethod: { id: 'payment-method-2', name: 'TWINT' },
    });
    renderEditView();

    expect(
      await screen.findByText(
        'userSubscriptionEdit.paymentMethodChange.pending'
      )
    ).toBeTruthy();
  });

  describe('imported subscriptions', () => {
    const importedAt = '2026-11-01T08:00:00.000Z';

    afterEach(() => {
      enabledFeatures.clear();
    });

    it('says that a subscription is a legacy one', async () => {
      enabledFeatures.add('legacy-subscriptions');
      mockQueries(null, false, null, { importedAt, legacy: true });
      renderEditView();

      expect(
        await screen.findByText('userSubscriptionEdit.imported.legacy')
      ).toBeTruthy();
    });

    it('says that an imported subscription was since paid for here', async () => {
      enabledFeatures.add('legacy-subscriptions');
      mockQueries(null, false, null, { importedAt, legacy: false });
      renderEditView();

      expect(
        await screen.findByText('userSubscriptionEdit.imported.paidHere')
      ).toBeTruthy();
    });

    it('says nothing about a subscription created here', async () => {
      enabledFeatures.add('legacy-subscriptions');
      mockQueries(null);
      renderEditView();

      await screen.findByText(
        'userSubscriptionEdit.deactivation.title.activated'
      );
      expect(screen.queryByText(/userSubscriptionEdit\.imported/)).toBeNull();
    });

    it('says nothing while the feature is off', async () => {
      mockQueries(null, false, null, { importedAt, legacy: true });
      renderEditView();

      await screen.findByText(
        'userSubscriptionEdit.deactivation.title.activated'
      );
      expect(screen.queryByText(/userSubscriptionEdit\.imported/)).toBeNull();
    });
  });

  it('shows no payment method change when there is none', async () => {
    mockQueries(null);
    renderEditView();

    await screen.findByText(
      'userSubscriptionEdit.deactivation.title.activated'
    );
    expect(
      screen.queryByText('userSubscriptionEdit.paymentMethodChange.pending')
    ).toBeNull();
  });

  it('names every field after the label shown above it', async () => {
    mockQueries(null);
    renderEditView();

    await screen.findByRole('checkbox', {
      name: 'userSubscriptionEdit.autoRenew',
    });

    expect(
      screen.getByRole('combobox', { name: /^userSubscriptionEdit.selectUser/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: /^userSubscriptionEdit.selectMemberPlan/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: /^memberPlanList.paymentPeriodicities/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: /^userSubscriptionEdit.paymentMethod/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', {
        name: /^userSubscriptionEdit.periodAmount/,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'userSubscriptionEdit.startsAt' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'userSubscriptionEdit.paidUntil' })
    ).toBeInTheDocument();
  });

  it('marks the required pickers as required without native validation', async () => {
    mockQueries(null);
    const { container } = renderEditView();

    await screen.findByRole('checkbox', {
      name: 'userSubscriptionEdit.autoRenew',
    });

    for (const name of [
      'userSubscriptionEdit.selectMemberPlan',
      'memberPlanList.paymentPeriodicities',
      'userSubscriptionEdit.paymentMethod',
    ]) {
      expect(screen.getByRole('combobox', { name })).toBeRequired();
    }
    expect(container.querySelector('form')).toHaveAttribute('novalidate');
  });

  it('offers no reactivation for a running subscription', async () => {
    mockQueries(null);
    renderEditView();

    expect(
      await screen.findByText(
        'userSubscriptionEdit.deactivation.title.activated'
      )
    ).toBeTruthy();
    expect(screen.queryByTestId('reactivateSubscription')).toBeNull();
  });

  it('reactivates a deactivated subscription after confirmation', async () => {
    mockQueries({ date: '2026-02-01T10:00:00.000Z', reason: 'none' });
    renderEditView();

    fireEvent.click(await screen.findByTestId('reactivateSubscription'));

    const reactivate = mutationFor(ReactivateSubscriptionDocument);
    expect(reactivate).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByText('userSubscriptionEdit.reactivation.confirm')
    );

    expect(reactivate).toHaveBeenCalledWith({
      variables: { id: 'subscription-1' },
    });
  });

  it('offers no upgrade revert when the upgrade has been paid', async () => {
    mockQueries({ date: '2026-02-01T10:00:00.000Z', reason: 'none' }, false);
    renderEditView();

    expect(await screen.findByTestId('reactivateSubscription')).toBeTruthy();
    expect(screen.queryByTestId('revertSubscriptionUpgrade')).toBeNull();
  });

  it('reverts an unpaid upgrade after confirmation', async () => {
    mockQueries(
      {
        date: '2026-02-01T10:00:00.000Z',
        reason: 'userReplacedSubscription',
      },
      true
    );
    renderEditView();

    fireEvent.click(await screen.findByTestId('revertSubscriptionUpgrade'));

    const revert = mutationFor(RevertSubscriptionUpgradeDocument);
    expect(revert).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByText('userSubscriptionEdit.revertUpgrade.confirm')
    );

    expect(revert).toHaveBeenCalledWith({
      variables: { id: 'subscription-1' },
    });
  });

  it('gives a new subscription the only periodicity of the chosen plan', async () => {
    mockQueries(null);
    renderCreateView();

    await screen.findByRole('combobox', {
      name: /^userSubscriptionEdit.selectMemberPlan/,
    });
    choosePlan('Lifelong');

    expect(periodicityPicker()).toHaveTextContent(
      'memberPlanList.paymentPeriodicity.lifetime'
    );
    expect(offeredPeriodicities()).toEqual([
      'memberPlanList.paymentPeriodicity.lifetime',
    ]);
  });

  it('gives a new subscription the default periodicity of a plan that offers several', async () => {
    mockQueries(null);
    renderCreateView();

    await screen.findByRole('combobox', {
      name: /^userSubscriptionEdit.selectMemberPlan/,
    });
    choosePlan('Monthly or yearly');

    expect(periodicityPicker()).toHaveTextContent(
      'memberPlanList.paymentPeriodicity.monthly'
    );
    expect(offeredPeriodicities()).toEqual([
      'memberPlanList.paymentPeriodicity.monthly',
      'memberPlanList.paymentPeriodicity.yearly',
    ]);
  });

  it('prices a new subscription for the periodicity the plan gave it', async () => {
    mockQueries(null);
    renderCreateView();

    await screen.findByRole('combobox', {
      name: /^userSubscriptionEdit.selectMemberPlan/,
    });
    choosePlan('Monthly or yearly');

    expect(
      screen.getByRole('textbox', {
        name: /^userSubscriptionEdit.periodAmount/,
      })
    ).toHaveValue('11.00');
  });

  it('still lists the periodicity of an existing subscription its plan does not offer', async () => {
    mockQueries(null, false, null, {
      memberPlan: lifelongPlan,
      paymentPeriodicity: 'yearly',
    });
    renderEditView();

    await screen.findByRole('checkbox', {
      name: 'userSubscriptionEdit.autoRenew',
    });

    expect(periodicityPicker()).toHaveTextContent(
      'memberPlanList.paymentPeriodicity.yearly'
    );
    expect(offeredPeriodicities()).toEqual([
      'memberPlanList.paymentPeriodicity.yearly',
      'memberPlanList.paymentPeriodicity.lifetime',
    ]);
  });
});
