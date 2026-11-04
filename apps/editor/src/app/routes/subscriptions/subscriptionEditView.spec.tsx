import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionDocument,
  UpdateSubscriptionDocument,
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

const features = vi.hoisted(() => ({ referrals: true }));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (key: string) => key === 'referrals' && features.referrals,
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
  overrides: Record<string, unknown> = {}
) => ({
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
  referredBy: null,
  periods: [],
  ...overrides,
});

const mockQueries = (
  deactivation: unknown,
  canRevertUpgrade = false,
  pendingPaymentMethodChange: unknown = null,
  overrides: Record<string, unknown> = {}
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
          subscription: subscription(
            deactivation,
            canRevertUpgrade,
            pendingPaymentMethodChange,
            overrides
          ),
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
        data: { memberPlans: { nodes: [memberPlan] } },
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

beforeEach(() => {
  mockedUseQuery.mockReset();
  mutationFor(ReactivateSubscriptionDocument).mockClear();
  mutationFor(RevertSubscriptionUpgradeDocument).mockClear();
  mutationFor(UpdateSubscriptionDocument).mockClear();
  features.referrals = true;
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

  describe('referred by', () => {
    const referrer = { id: 'referrer-1', name: 'Referrer', firstName: 'Rita' };

    it('shows who referred the subscription', async () => {
      mockQueries(null, false, null, { referredBy: referrer });
      renderEditView();

      expect(await screen.findByDisplayValue(/Rita Referrer/)).toBeTruthy();
    });

    it('saves who referred the subscription', async () => {
      mockQueries(null, false, null, { referredBy: referrer });
      renderEditView();

      fireEvent.click(await screen.findByRole('button', { name: 'save' }));

      await waitFor(() =>
        expect(mutationFor(UpdateSubscriptionDocument)).toHaveBeenCalledWith({
          variables: expect.objectContaining({ referredByID: 'referrer-1' }),
        })
      );
    });

    it('saves a subscription nobody referred without a referrer', async () => {
      mockQueries(null);
      renderEditView();

      fireEvent.click(await screen.findByRole('button', { name: 'save' }));

      await waitFor(() =>
        expect(mutationFor(UpdateSubscriptionDocument)).toHaveBeenCalledWith({
          variables: expect.objectContaining({ referredByID: null }),
        })
      );
    });

    it('keeps the referrer untouched while referrals are switched off for the medium', async () => {
      features.referrals = false;
      mockQueries(null, false, null, { referredBy: referrer });
      renderEditView();

      fireEvent.click(await screen.findByRole('button', { name: 'save' }));

      await waitFor(() =>
        expect(mutationFor(UpdateSubscriptionDocument)).toHaveBeenCalled()
      );
      expect(screen.queryByText('userSubscriptionEdit.referredBy')).toBeNull();
      expect(
        mutationFor(UpdateSubscriptionDocument).mock.calls[0][0].variables
      ).not.toHaveProperty('referredByID');
    });

    it('refuses a reader referring themselves', async () => {
      mockQueries(null, false, null, {
        referredBy: { id: 'user-1', name: 'Muster', firstName: 'Max' },
      });
      renderEditView();

      fireEvent.click(await screen.findByRole('button', { name: 'save' }));

      expect(
        await screen.findByText('errorMessages.selfReferralErrorMessage')
      ).toBeTruthy();
      expect(mutationFor(UpdateSubscriptionDocument)).not.toHaveBeenCalled();
    });
  });
});
